import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export function useVoiceInteraction() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  // Web Speech API references if running in web/hybrid environment
  const recognitionRef = useRef<any>(null);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSpeechId(null);
  }, []);

  // Speak AI answer
  const speakText = useCallback(
    (
      text: string,
      messageId: string,
      onStart?: () => void,
      onDone?: () => void,
    ) => {
      if (!text || !text.trim()) return;

      if (isSpeaking && activeSpeechId === messageId) {
        stopSpeaking();
        return;
      }

      stopSpeaking();

      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        // Strip markdown asterisks and source tags for clean speech
        const cleanSpeechText = text
          .replace(/\[Source\s+[^\]]+\]/gi, '')
          .replace(/[*_#`]/g, '')
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setActiveSpeechId(messageId);
          onStart?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setActiveSpeechId(null);
          onDone?.();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setActiveSpeechId(null);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // Platform indicator for native builds
        setIsSpeaking(true);
        setActiveSpeechId(messageId);
        setTimeout(() => {
          setIsSpeaking(false);
          setActiveSpeechId(null);
          onDone?.();
        }, 1500);
      }
    },
    [isSpeaking, activeSpeechId, stopSpeaking],
  );

  // Start voice transcription
  const startListening = useCallback(
    (onTranscript: (transcription: string) => void) => {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window))
      ) {
        const SpeechRec =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            onTranscript(currentTranscript);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setIsListening(true);
      }
    },
    [],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopSpeaking, stopListening]);

  return {
    isSpeaking,
    isListening,
    activeSpeechId,
    speakText,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
