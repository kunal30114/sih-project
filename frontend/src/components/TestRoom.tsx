import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { IconRiCameraLine } from './IconRiCameraLine';
import { IconRiCameraOffLine } from './IconRiCameraOffLine';
import { IconRiMicLine } from './IconRiMicLine';
import { IconRiMicOffLine } from './IconRiMicOffLine';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

function TestRoom() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isGifVisible, setIsGifVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recogRef: any = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recogRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      const transcriptResult = e.results[0][0].transcript;
      setTranscript(transcriptResult);
    };

    recognition.onspeechend = () => {
      setIsListening(false);
      recognition.stop();
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (isListening) {
      setIsListening(false);
      recogRef.current.stop();
    } else {
      setIsListening(true);
      recogRef.current.start();
    }
  };

  const speakText = () => {
    if ('speechSynthesis' in window && response) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 1;

      utterance.onstart = () => {
        setIsGifVisible(true);
      };

      utterance.onend = () => {
        setIsGifVisible(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const getResponse = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/v1/user/callModel', { query: transcript });
      const newResponse = res.data.message;
      setResponse(newResponse);
      setConversationHistory([...conversationHistory, { user: transcript, ai: newResponse }]);
      speakText();
    } catch (error) {
      console.error('Error fetching response:', error);
    }
  };

  useEffect(() => {
    if (transcript) {
      getResponse();
    }
  }, [transcript]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-200 bg-zinc-900">
      <div className="flex justify-between p-4 bg-zinc-800">
        <h2 className="text-2xl font-semibold">
          <img
          src='inter-o-view.jpg'
          alt='logo'
          height={'40px'}
          width={'80px'}
          className='rounded-lg'
          />
        </h2>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 text-black bg-white rounded-md"
        >
          End Interview
        </button>
      </div>

      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Left Section with Camera and GIF */}
        <div className="flex flex-col items-center flex-1 gap-4">
          <div className="flex flex-row justify-center w-full gap-4">
            {/* Camera Area */}
            <div className="relative w-1/2 max-w-sm overflow-hidden bg-gray-800 h-72 rounded-3xl">
              <video ref={videoRef} autoPlay className={`w-full h-full ${isCameraOn ? 'block' : 'hidden'}`}></video>
              {!isCameraOn && (
                <div className="flex items-center justify-center h-full text-3xl text-white">
                  User
                </div>
              )}
            </div>

            {/* GIF Area */}
            <div className="relative items-center justify-center w-1/2 max-w-sm overflow-hidden bg-zinc-800 h-72 rounded-3xl">
              {(isGifVisible && !isListening) ? (
                <img
                  src="interviewer1.gif"
                  alt="Interviewer"
                  className="object-cover h-full w-fit"
                />
              ) : (
                <img
                  src="interviewer1.png"
                  alt="Interviewer"
                  className="object-cover h-full w-fit "
                />
              )}
            </div>
          </div>

          {/* Camera and Mic Icons */}
          <div className="flex justify-center p-2 rounded-3xl">
            <button
              onClick={toggleCamera}
              className={`items-center justify-center p-4 mr-4 rounded-full ${isCameraOn ? 'bg-green-600' : 'bg-red-600'}`}
            >
              {isCameraOn ? (
                <IconRiCameraLine className="text-3xl" />
              ) : (
                <IconRiCameraOffLine className="text-3xl" />
              )}
            </button>

            <button
              onClick={startListening}
              className={`items-center justify-center p-4 rounded-full ${isListening ? 'bg-green-600' : 'bg-red-600'}`}
            >
              {isListening ? <IconRiMicLine className="text-3xl" /> : <IconRiMicOffLine className="text-3xl" />}
            </button>
          </div>

          {/* Message and Response Section */}
          <div className="w-full min-h-0 p-4 rounded-md bg-zinc-800">
            {transcript && (
              <p className="p-4 mt-2 text-lg rounded-md">
                <span className="font-semibold">User:</span> <br /> {transcript}
              </p>
            )}
            {response && (
              <p className="p-4 mt-2 text-lg rounded-md">
                <span className="font-semibold">AI Response:</span> <br /> {response}
              </p>
            )}
          </div>
        </div>

        {/* Right Section with Conversation History */}
        <div className="flex flex-col flex-1 p-4 bg-zinc-800 rounded-3xl max-w-[600px]">
          <h3 className="text-2xl font-semibold">Past Conversations</h3>
          <div className="flex flex-col p-4 mt-2 space-y-4 overflow-y-auto min-h-[560px] max-h-[560px] rounded-2xl bg-zinc-00">
            {conversationHistory.map((conv, index) => (
              <div key={index} className="pb-2 border-b border-gray-600">
                <CollapsibleMessage message={conv.user} isUser />
                <CollapsibleMessage message={conv.ai} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleMessage({ message, isUser }: { message: string, isUser?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 40; // Maximum length before collapsing

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <p className="cursor-pointer" onClick={toggleExpand}>
      <span className="font-semibold">{isUser ? 'User:' : 'AI Response:'}</span>{' '}
      {isExpanded || message.length <= MAX_LENGTH ? (
        <span>{message}</span>
      ) : (
        <span>
          {message.substring(0, MAX_LENGTH)}...{' '}
          <button className="text-blue-500">Expand</button>
        </span>
      )}
    </p>
  );
}

export default TestRoom;
