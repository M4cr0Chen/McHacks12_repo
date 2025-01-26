import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function App() {
  const [transcript, setTranscript] = useState('');
  const [uploadedTranscript, setUploadedTranscript] = useState('testonly');
  const [summary, setSummary] = useState('');
  const [recording, setRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const eventSourceRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const BASE_URL = 'http://localhost:3000';


  const handleStartRecordingMultipleFunc = () => {
    handleStart();
    handleToggleRecording();
  }

  const handleStopRecordingMultipleFunc = () => {
    handleStop();
    handleToggleRecording();
  }
  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

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
    <div style={{
      margin: 20,
    }}>
      <div style={{
        textAlign: 'center', marginBottom: 20, marginTop: 10, fontSize: 24, fontWeight: 'bold', color: '#333',
        textShadow: '1px 1px 1px #000', letterSpacing: 1,
      }}>
        {/* <h1>Real-Time Meeting Transcription & Summary</h1> */}
      </div>



      <div style={{ marginBottom: 10, display: 'flex' }}>


        <button onClick={handleStart} disabled={recording} style={{
          backgroundColor: 'white',
          color: 'black',
          margin: 30,
          marginBottom: 5,
          padding: 10,
          paddingTop: 15,
          paddingBottom: 15,
          fontSize: 16,
          marginLeft: 20,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 20,
          fontFamily: 'Consolas',
          textAlign: 'center',
          display: 'flex',
        }}>
          <img src="src/assets/play.svg" alt="play" style={{ width: 30, height: 30, marginLeft: 20, marginBottom: 0 }} />

          <div style={{
            marginTop: 5,
            marginLeft: 20,
            marginRight: 20,
          }}>
            Start
          </div></button>


        <button onClick={handleStop} disabled={recording} style={{
          backgroundColor: 'black',
          color: 'white',
          margin: 30,
          marginBottom: 5,
          padding: 10,
          paddingTop: 15,
          paddingBottom: 15,
          fontSize: 16,
          marginLeft: 20,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 20,
          fontFamily: 'Consolas',
          textAlign: 'center',
          display: 'flex',
        }}>
          <img src="src/assets/resume.svg" alt="play" style={{ width: 30, height: 30, marginLeft: 20, marginBottom: 0 }} />

          <div style={{
            marginTop: 5,
            marginLeft: 20,
            marginRight: 20,
          }}>
            Stop
          </div></button>
      </div>

      {/* <div>

        <button onClick={handleStop} disabled={!recording} style={{
          marginLeft: 20,
          marginTop: 5,
          backgroundColor: 'white',
          color: 'black',
          padding: 10,
          fontSize: 16,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 20,
          paddingTop: 15,
          paddingBottom: 15,
          fontFamily: 'Consolas',
          display: 'flex',

        }}>
          <img src="src/assets/upload.svg" alt="play" style={{ width: 30, height: 30, marginLeft: 20, marginBottom: 0 }} />
          <div style={{
            marginTop: 5,
            marginLeft: 20,
            marginRight: 20,
          }}>
            Or upload pre-recorded files.
          </div></button>
      </div> */}

      {/* <div>
        <input type="file" accept=".txt, .mp3" onChange={handleUpload} style={{
          padding: 10,
          fontSize: 16,
          border: '1px solid #ccc',
          borderRadius: 5,
          width: '15%',
          marginTop: 10,
          marginLeft: 20,
          color: '#333',
          display: 'inline-block',
          cursor: 'pointer',
        }} />
      </div> */}

      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
        style={{
          margin: 20,
          fontSize: 16,
          fontFamily: 'Consolas',
        }}
      >
        Or upload pre-recorded files.
        <VisuallyHiddenInput
          type="file"
          onChange={handleUpload}
          multiple
        />
      </Button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-evenly',
        marginTop: 20,
        paddingLeft: 10,
        paddingRight: 10,

      }}>
        <div style={{
          border: '1px solid #ccc',
          padding: 10,
          minHeight: 200,
          whiteSpace: 'pre-wrap',
          width: '40%',
          borderRadius: 20,
          backgroundColor: 'white',
        }}>
          <h3 style={{
            color: 'black',
            marginLeft: 20,
          }}>Live Transcription:</h3>
          {transcript}
        </div>

        <div style={{
          border: '1px solid #ccc',
          padding: 10,
          minHeight: 120,
          width: '40%',
          borderRadius: 20,
          backgroundColor: 'white',
        }}>
          <h3 style={{
            color: 'black',
            marginLeft: 20,
          }}>📌 Meeting Summary</h3>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </div>



      {uploadedTranscript && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowTranscript(!showTranscript)} style={{
            backgroundColor: 'black',
            color: 'white',
            margin: 30,
            marginBottom: 5,
            padding: 15,
            paddingTop: 15,
            paddingBottom: 15,
            fontSize: 16,
            marginLeft: 20,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 20,
            fontFamily: 'Consolas',
            textAlign: 'center',
            display: 'flex',
          }}>
            {showTranscript ? "Hide Transcript" : "Show Uploaded Transcript"}
          </button>
          {showTranscript && (
            <div style={{
              border: '1px solid #ccc',
              padding: 10,
              minHeight: 150,
              marginTop: 10,
              marginLeft: 20,
              marginRight: 20,
              whiteSpace: 'pre-wrap',
              backgroundColor: 'black',
              borderRadius: 20,
              color: 'white',
              paddingLeft: 30,
              fontFamily: 'Consolas',
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
