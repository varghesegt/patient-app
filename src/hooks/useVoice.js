import { useRef, useState, useEffect, useCallback } from "react";

export default function useVoice({
  symptomsList = [],
  language = "en-US",
  autoRestart = true,
  confidenceThreshold = 0.6,
  debounceTime = 300,
  onStart,
  onEnd,
  onError,
  onMatch,
} = {}) {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [matches, setMatches] = useState([]);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [lastHeardAt, setLastHeardAt] = useState(null);

  const supported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // Debounce transcript updates for smoother UI
  const debounceRef = useRef(null);
  const updateTranscript = useCallback(
    (text) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setTranscript(text);
      }, debounceTime);
    },
    [debounceTime]
  );

  useEffect(() => {
    if (!supported) return;

    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setListening(true);
        setError(null);
        onStart?.();
      };

      recognition.onend = () => {
        setListening(false);
        onEnd?.();

        // Auto-restart if enabled
        if (autoRestart) {
          recognition.start();
        }
      };

      recognition.onerror = (event) => {
        setError(event.error);
        console.error("Speech recognition error:", event.error);
        onError?.(event.error);

        if (event.error === "not-allowed") {
          setListening(false);
        }
      };

      recognition.onresult = (event) => {
        let fullTranscript = "";
        let detectedMatches = [];

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i][0];
          if (result.confidence >= confidenceThreshold) {
            fullTranscript += result.transcript;

            // Check symptoms
            symptomsList.forEach((symptom) => {
              if (result.transcript.toLowerCase().includes(symptom.toLowerCase())) {
                const matchData = {
                  symptom,
                  confidence: result.confidence,
                  timestamp: Date.now(),
                  raw: result.transcript,
                };
                detectedMatches.push(matchData);
                onMatch?.(matchData);
              }
            });
          }
        }

        updateTranscript(fullTranscript.trim());
        if (detectedMatches.length > 0) {
          setMatches((prev) => [...prev, ...detectedMatches]);
        }
        setLastHeardAt(Date.now());
      };

      recognitionRef.current = recognition;
    }
  }, [
    supported,
    symptomsList,
    language,
    autoRestart,
    confidenceThreshold,
    updateTranscript,
    onStart,
    onEnd,
    onError,
    onMatch,
  ]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition already started");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    supported,
    transcript,
    matches,
    listening,
    error,
    lastHeardAt,
    startListening,
    stopListening,
  };
}
