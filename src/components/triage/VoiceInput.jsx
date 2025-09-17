import React, { useEffect, useRef, useState } from 'react';

export default function VoiceInput({ value, onChange, keywords = [] }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const win = window;
    if (!('webkitSpeechRecognition' in win) && !('SpeechRecognition' in win)) return;

    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = true;  // Enable partial results
    rec.continuous = true;      // Keep listening continuously

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcriptChunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          onChange((v) => (v ? v + ' ' + transcriptChunk : transcriptChunk));
        } else {
          interim += transcriptChunk;
        }
      }
      setPartialTranscript(interim);

      // Detect keywords in real-time
      const detected = keywords.filter((kw) =>
        (value + ' ' + interim).toLowerCase().includes(kw.toLowerCase())
      );
      setMatches(detected);
    };

    rec.onerror = (e) => {
      console.error('Voice recognition error:', e.error);
      if (listening) rec.start(); // Auto-restart on error
    };

    rec.onend = () => {
      if (listening) rec.start(); // Auto-restart if stopped unexpectedly
    };

    recRef.current = rec;
  }, [onChange, value, listening, keywords]);

  const toggleListening = () => {
    if (!recRef.current) return alert('Voice not supported');
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      recRef.current.start();
      setListening(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <button
          onClick={toggleListening}
          className={`px-3 py-2 rounded ${listening ? 'bg-green-400' : 'bg-yellow-400'}`}
        >
          {listening ? 'Listening...' : 'Voice'}
        </button>
        <div className="text-sm text-gray-600">
          {listening ? 'Speak now' : 'Tap to speak'}
        </div>
      </div>
      <div className="text-gray-800">
        <strong>Partial:</strong> {partialTranscript}
      </div>
      {keywords.length > 0 && (
        <div className="text-red-600">
          <strong>Detected Keywords:</strong> {matches.join(', ') || 'None'}
        </div>
      )}
    </div>
  );
}
