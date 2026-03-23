import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, AlertCircle } from 'lucide-react';

const VoiceRecorder = ({ onTranscriptionComplete, onError, disabled = false }) => {
  const [status, setStatus] = useState('idle'); // idle, recording, completed, error
  const [duration, setDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  const recognitionRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const manualStopRef = useRef(false);
  const currentTextRef = useRef('');

  // Initialize Web Speech API on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus('error');
      setErrorMessage(
        'Your browser does not support voice recognition. Please use Chrome, Firefox, Safari, or Edge.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('recording');
      setDuration(0);
      setTranscribedText('');
      setErrorMessage('');
      setIsFinal(false);
      recordingStartTimeRef.current = Date.now();

      // Duration counter
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setDuration(elapsed);

        // Auto-stop at 5 minutes
        if (elapsed >= 300) {
          recognition.stop();
          setErrorMessage('Recording stopped. Maximum duration is 5 minutes.');
        }
      }, 100);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Build complete text: all final results + current interim
      const allFinal = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript)
        .join(' ');

      const completeText = allFinal + (interimTranscript ? ' ' + interimTranscript : '');
      const trimmedText = completeText.trim();
      
      // Update both state and ref
      setTranscribedText(trimmedText);
      currentTextRef.current = trimmedText;
    };

    recognition.onerror = (event) => {
      let errorMsg = 'An error occurred during speech recognition.';
      
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMsg = 'No microphone found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMsg = 'Microphone access denied. Please enable microphone access in your browser settings.';
          break;
        case 'network':
          errorMsg = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMsg = `Error: ${event.error}`;
      }

      setErrorMessage(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    };

    recognition.onend = () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Only set to completed if we were recording and manually stopped
      if (manualStopRef.current && status === 'recording') {
        setStatus('completed');
        setIsFinal(true);
        onTranscriptionComplete?.(transcribedText);
        manualStopRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setErrorMessage('');
      setTranscribedText('');
      setIsFinal(false);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && status === 'recording') {
      manualStopRef.current = true;
      recognitionRef.current.stop();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      // Immediately call the callback with current transcribed text
      setTimeout(() => {
        setStatus('completed');
        setIsFinal(true);
        onTranscriptionComplete?.(currentTextRef.current);
      }, 50);
    }
  };

  const resetRecorder = () => {
    setStatus('idle');
    setDuration(0);
    setTranscribedText('');
    setErrorMessage('');
    setIsFinal(false);
    currentTextRef.current = '';
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDisabled = disabled;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Voice Recognition</h3>
        <div className="flex items-center gap-2">
          {status === 'recording' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-600">Listening...</span>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-600">Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {status === 'recording' && (
        <div className="mb-3 text-center">
          <span className="text-2xl font-mono font-bold text-gray-800">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Live Transcription Display */}
      {transcribedText && (
        <div className="mb-3 p-3 bg-white border border-gray-300 rounded min-h-12">
          <p className="text-sm text-gray-800">
            {transcribedText}
            {status === 'recording' && !isFinal && (
              <span className="animate-pulse text-gray-400">|</span>
            )}
          </p>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        {status === 'idle' && (
          <button
            onClick={startRecording}
            disabled={isDisabled}
            aria-label="Start voice recognition"
            aria-pressed="false"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Mic className="w-4 h-4" />
            Start Speaking
          </button>
        )}

        {status === 'recording' && (
          <button
            onClick={stopRecording}
            disabled={isDisabled}
            aria-label="Stop voice recognition"
            aria-pressed="true"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={resetRecorder}
            disabled={isDisabled}
            aria-label="Try again"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}

        {status === 'completed' && (
          <button
            onClick={resetRecorder}
            disabled={isDisabled}
            aria-label="Record new answer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Record Again
          </button>
        )}
      </div>

      {/* Status Message */}
      {status === 'completed' && (
        <p className="mt-3 text-sm text-green-700 font-medium">
          ✓ Recording complete. You can now edit and submit your answer.
        </p>
      )}

      {status === 'recording' && (
        <p className="mt-3 text-xs text-gray-600">
          Speaking is being transcribed in real-time. Click Stop when done.
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder;
