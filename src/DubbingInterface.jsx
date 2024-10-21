import React, { useState, useRef, createContext, useEffect } from "react";

// Create a context for global state management
const DubbingContext = createContext();

// Mock data for dialogues
const mockDialogues = [
  {
    id: 1,
    originalText: "Hello, how are you?",
    translatedText: "Hola, ¿cómo estás?",
  },
  {
    id: 2,
    originalText: "I'm fine, thank you.",
    translatedText: "Estoy bien, gracias.",
  },
  {
    id: 3,
    originalText: "What's your name?",
    translatedText: "¿Cómo te llamas?",
  },
];

const DubbingInterface = () => {
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationIdRef = useRef(null);

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();

        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        const audioChunks = [];
        mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });

        mediaRecorderRef.current.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
        });

        setIsRecording(true);
        visualizeAudio();
      })
      .catch((err) => {
        setError("Error accessing microphone: " + err.message);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const visualizeAudio = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = analyser.frequencyBinCount;

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "rgb(200, 200, 200)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(0, 0, 0)";

      canvasCtx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  // Video controls
  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const seekVideo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime += time;
    }
  };

  // Dialogue navigation
  const nextDialogue = () => {
    if (currentDialogue < mockDialogues.length - 1) {
      setCurrentDialogue(currentDialogue + 1);
    }
  };

  const prevDialogue = () => {
    if (currentDialogue > 0) {
      setCurrentDialogue(currentDialogue - 1);
    }
  };

  return (
    <DubbingContext.Provider
      value={{ currentDialogue, isRecording, audioUrl, error }}
    >
      <div className="flex flex-col h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">Mobile Dubbing Interface</h1>

        {/* Video Player */}
        <div className="relative aspect-video mb-4">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="/sample-video.mp4"
            onError={() => setError("Error loading video")}
          />
        </div>

        {/* Video Controls */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={isVideoPlaying ? pauseVideo : playVideo}
            className="p-2 bg-blue-500 text-white rounded-full"
          >
            {isVideoPlaying ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button
            onClick={() => seekVideo(-10)}
            className="p-2 bg-gray-500 text-white rounded-full"
          >
            ⏪ -10s
          </button>
          <button
            onClick={() => seekVideo(10)}
            className="p-2 bg-gray-500 text-white rounded-full"
          >
            ⏩ +10s
          </button>
        </div>

        {/* Dialogue Navigation */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={prevDialogue}
            className="p-2 bg-yellow-500 text-white rounded-full"
          >
            Previous
          </button>
          <button
            onClick={nextDialogue}
            className="p-2 bg-green-500 text-white rounded-full"
          >
            Next
          </button>
        </div>

        {/* Dialogue Display */}
        <div className="mb-4">
          <textarea
            value={mockDialogues[currentDialogue].originalText}
            className="w-full p-2 mb-2 border rounded"
            placeholder="Original Text"
          />
          <textarea
            value={mockDialogues[currentDialogue].translatedText}
            className="w-full p-2 border rounded"
            placeholder="Translated Text"
          />
        </div>

        {/* Audio recorder */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className="p-2 bg-red-500 text-white rounded-full"
          >
            {isRecording ? "⏹️" : "🎙️"}
          </button>
        </div>

        {/* Audio Visualization */}
        <canvas ref={canvasRef} className="w-full h-24 bg-gray-200 mb-4" />

        {/* Error Display */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && <audio ref={audioRef} src={audioUrl} controls />}
      </div>
    </DubbingContext.Provider>
  );
};

export default DubbingInterface;
