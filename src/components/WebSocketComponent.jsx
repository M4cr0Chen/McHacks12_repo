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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
  <div className="mx-auto max-w-3xl space-y-8">
    {/* 标题部分 */}
    <header className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-800">
        <span className="mr-2 animate-pulse text-red-500">🔴</span>
        Live Meeting Summary
      </h1>
      <span className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-gray-600 shadow-sm">
        Beta
      </span>
    </header>

    {/* 控制按钮组 */}
    <div className="flex flex-wrap gap-3 sm:gap-4">
      <button
        onClick={startRecording}
        disabled={recording}
        className="flex items-center rounded-lg bg-green-500 px-5 py-3 text-sm font-medium text-white transition-all 
                 hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                 disabled:opacity-50 disabled:hover:bg-green-500 sm:text-base"
      >
        <span className="mr-2">🎤</span>
        Start Recording
      </button>
      <button
        onClick={stopRecording}
        disabled={!recording}
        className="flex items-center rounded-lg bg-red-500 px-5 py-3 text-sm font-medium text-white transition-all
                 hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                 disabled:opacity-50 disabled:hover:bg-red-500 sm:text-base"
      >
        <span className="mr-2">⏹</span>
        Stop Recording
      </button>
    </div>

    {/* 实时转录面板 */}
    <section className="overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
        <h2 className="flex items-center text-lg font-semibold text-gray-700">
          <span className="mr-2 text-blue-500">📝</span>
          Live Transcript
        </h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-700 leading-relaxed">
          {transcript || (
            <span className="text-gray-400">Waiting for speech input...</span>
          )}
        </p>
      </div>
    </section>

    {/* AI摘要面板 */}
    <section className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
      <div className="border-b border-blue-100 bg-white/50 px-6 py-4">
        <h2 className="flex items-center text-lg font-semibold text-gray-700">
          <span className="mr-2 text-indigo-500">🤖</span>
          AI Summary
        </h2>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-800 leading-relaxed">
          {summary || (
            <span className="text-gray-400">Summary will appear here...</span>
          )}
        </p>
      </div>
    </section>
  </div>
</div>
  );
};

export default WebSocketComponent;
