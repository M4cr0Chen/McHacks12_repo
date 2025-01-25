import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [transcript, setTranscript] = useState('');
  const [uploadedTranscript, setUploadedTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [recording, setRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const eventSourceRef = useRef(null);

  const BASE_URL = 'http://localhost:3000'; 

  const handleStart = async () => {
    if (recording) return;
    setTranscript('');
    setSummary('');
    setUploadedTranscript('');

    try {
      const res = await fetch(`${BASE_URL}/start`);
      if (!res.ok) {
        console.error('Start error:', res.statusText);
        return;
      }
      setRecording(true);

      eventSourceRef.current = new EventSource(`${BASE_URL}/stream`);
      
      eventSourceRef.current.onmessage = (event) => {
        console.log("SSE Message Received:", event.data);
    
        try {
            const data = JSON.parse(event.data);
    
            if (data.type === "transcript") {
                setTranscript((prev) => {
                    // Split text into words and prevent duplicates
                    const prevWords = prev.split(" ");
                    const newWords = data.text.split(" ");
                    
                    if (prevWords.slice(-newWords.length).join(" ") !== newWords.join(" ")) {
                        return prev + " " + data.text;
                    }
                    return prev;
                });
            } else if (data.type === "summary") {
                console.log("Updating summary in UI:", data.text);
                setSummary(data.text);
            }
        } catch (error) {
            console.error("Error parsing SSE message:", error);
        }
    };
    
    } catch (error) {
      console.error('Error starting:', error);
    }
  };

  const handleStop = async () => {
    if (!recording) return;

    const response = await fetch(`${BASE_URL}/stop`);
    if (response.ok) {
        const result = await response.json();
        setRecording(false);
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setSummary(result.summary); // Update summary in UI
    } else {
        console.error('Stop failed:', await response.text());
    }
};


  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log("Uploading file:", file.name);

        const response = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload file');
        }

        const result = await response.json();
        console.log("Uploaded Transcript:", result.transcript);
        console.log("Summary from uploaded file:", result.summary);

        setUploadedTranscript(result.transcript);
        setSummary(result.summary);
        setShowTranscript(false);  // Open transcript view after upload
    } catch (error) {
        console.error('Error uploading file:', error);
    }
  };

  return (
    <div style={{ margin: 20 }}>
      <h1>Real-Time Meeting Transcription & Summary</h1>
      
      <div style={{ marginBottom: 10 }}>
        <button onClick={handleStart} disabled={recording}>Start</button>
        <button onClick={handleStop} disabled={!recording} style={{ marginLeft: 8 }}>Stop</button>
      </div>

      <div>
        <input type="file" accept=".txt, .mp3" onChange={handleUpload} />
      </div>

      <div style={{
        border: '1px solid #ccc',
        padding: 10,
        minHeight: 200,
        whiteSpace: 'pre-wrap',
      }}>
        <h3>Live Transcription:</h3>
        {transcript}
      </div>

      <div style={{
    border: '1px solid #ccc',
    padding: 10,
    minHeight: 120,
    marginTop: 20,
}}>
    <h3>📌 Meeting Summary</h3>
    <ReactMarkdown>{summary}</ReactMarkdown>
</div>


      {uploadedTranscript && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? "Hide Transcript" : "Show Uploaded Transcript"}
          </button>
          {showTranscript && (
            <div style={{
              border: '1px solid #ccc',
              padding: 10,
              minHeight: 150,
              marginTop: 10,
              whiteSpace: 'pre-wrap',
            }}>
              <h3>Uploaded Transcript:</h3>
              {uploadedTranscript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
