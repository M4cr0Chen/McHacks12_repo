import express from 'express';
import cors from 'cors';
import { SpeechClient } from '@google-cloud/speech';
import recorder from 'node-record-lpcm16';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const speechClient = new SpeechClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({ dest: 'uploads/' });

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

let isRecording = false;
let recognizeStream = null;
let transcriptBuffer = [];
let summary = "";
let sseClients = [];

// Function to broadcast live transcription to SSE clients
function broadcastTranscript(text) {
    if (transcriptBuffer.length > 0 && transcriptBuffer[transcriptBuffer.length - 1] === text) {
        return; // Avoid sending duplicate text
    }
    transcriptBuffer.push(text);
    sseClients.forEach((res) => {
        res.write(`data: ${JSON.stringify({ type: "transcript", text })}\n\n`);
    });
}


// Function to transcribe uploaded audio files
async function transcribeAudio(filePath) {
    const audio = {
        content: fs.readFileSync(filePath).toString('base64'),
    };

    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };

    const request = {
        audio,
        config,
    };

    try {
        const [response] = await speechClient.recognize(request);
        return response.results.map(result => result.alternatives[0].transcript).join(' ');
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return null;
    }
}

// Function to summarize transcriptions
async function summarizeText(text) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: `You are an AI assistant summarizing meeting transcripts.
                    Provide the summary in **structured Markdown format** with the following structure:
                    
                    ## 📌 Meeting Summary
                    
                    ### ✅ Action Points
                    - **Task:** [Describe the task]  
                      - **Assigned to:** [Person responsible]  
                      - **Deadline:** [Due date, if available]  

                    ### 📅 Scheduled Dates
                    - **Event:** [Describe the event]  
                      - **Date:** [Specify the date]  
                      - **Location:** [If applicable]  

                    ### 🔄 Follow-ups
                    - **Pending Tasks:** [List tasks that require follow-up]  
                    - **Responsible Person:** [Who is responsible for each follow-up]  
                    - **Deadline:** [When it should be completed]  

                    ### 📝 General Notes
                    - **Key Discussion Points:** [Summarize any important topics discussed]  
                    - **Decisions Made:** [List major decisions made during the meeting]  
                    - **Challenges Identified:** [Any problems or blockers mentioned]  
                    - **Next Steps:** [What needs to happen before the next meeting]  

                    Ensure all references to dates are in the format YYYY-MM-DD.`
                },
                { role: "user", content: text }
            ],
            max_tokens: 400,
        });

        return response.choices[0]?.message?.content || "Summary unavailable.";
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "Summary generation failed.";
    }
}

// File upload endpoint (supports text and audio)
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);
    const fileType = path.extname(req.file.originalname).toLowerCase();
    
    try {
        let transcript = "";
        
        if (fileType === ".txt") {
            transcript = fs.readFileSync(filePath, 'utf8');
        } else if ([".mp3", ".wav", ".flac"].includes(fileType)) {
            transcript = await transcribeAudio(filePath);
            if (!transcript) {
                return res.status(500).send({ error: 'Failed to transcribe audio file' });
            }
        } else {
            return res.status(400).send({ error: 'Unsupported file format. Please upload .txt or audio file (.mp3, .wav, .flac)' });
        }

        const summary = await summarizeText(transcript);

        res.send({ transcript, summary });

    } catch (error) {
        console.error("File processing error:", error);
        res.status(500).send({ error: 'Failed to process file' });
    } finally {
        fs.unlinkSync(filePath);
    }
});

// SSE for real-time transcription
app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    sseClients.push(res);

    res.on('close', () => {
        sseClients = sseClients.filter((client) => client !== res);
    });
});

// Start live transcription
app.get('/start', (req, res) => {
    if (isRecording) {
        return res.status(400).send('Already recording');
    }
    isRecording = true;
    transcriptBuffer = [];
    summary = "";

    const request = {
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
        },
        interimResults: true,
    };

    recognizeStream = speechClient
        .streamingRecognize(request)
        .on('error', (err) => console.error('Speech API error:', err))
        .on('data', (data) => {
            if (data.results?.[0]?.alternatives?.[0]) {
                const transcript = data.results[0].alternatives[0].transcript;
                broadcastTranscript(transcript);
            }
        });

    recorder
        .record({ sampleRateHertz: 16000, threshold: 0, silence: '1.0', keepSilence: true })
        .stream()
        .on('error', (err) => console.error('Audio stream error:', err))
        .pipe(recognizeStream);

    res.send('Recording started');
});

// Stop live transcription
app.get('/stop', async (req, res) => {
    if (!isRecording) {
        return res.status(400).send('Not currently recording');
    }
    isRecording = false;

    if (recognizeStream) {
        recognizeStream.destroy();
        recognizeStream = null;
    }

    summary = await summarizeText(transcriptBuffer.join(" ")); // Store summary

    res.send({ message: 'Recording stopped', summary }); // Return summary
});


// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
