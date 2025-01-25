import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const WebSocketComponent = () => {
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [socket, setSocket] = useState(null);
  let mediaRecorder;

  useEffect(() => {
    const newSocket = io("ws://localhost:8080"); // Connect to WebSocket backend
    newSocket.on("message", (data) => {
      setTranscript(prev => prev + " " + data.transcript); // Append transcript
      setSummary(data.summary); // Update summary
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data); // Send audio chunk to backend
      }
    };

    mediaRecorder.start(500); // Send every 500ms
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold">🔴 Live Meeting Summary</h1>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={startRecording}
          disabled={recording}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          🎤 Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!recording}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          ⏹ Stop Recording
        </button>
      </div>

      <div className="mt-4 p-4 bg-white shadow-md rounded-md">
        <h2 className="text-lg font-semibold">Live Transcript:</h2>
        <p className="text-gray-700">{transcript}</p>
      </div>
      <div className="mt-4 p-4 bg-blue-100 shadow-md rounded-md">
        <h2 className="text-lg font-semibold">AI Summary:</h2>
        <p className="text-gray-900">{summary}</p>
      </div>
    </div>
  );
};

export default WebSocketComponent;
