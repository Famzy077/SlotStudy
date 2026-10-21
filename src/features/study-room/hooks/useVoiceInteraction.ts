import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Strip markdown syntax, citations, emojis, and symbols so TTS reads clean, natural speech
 */
export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace code blocks with brief note
    .replace(/```[\s\S]*?```/g, ' code snippet. ')
    // Strip source citations like [Source 1], [Source 2, Page 3]
    .replace(/\[(?:Source|Sources)\s*[^\]]*\]/gi, '')
    // Strip markdown links [text](url) -> keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip headers (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Strip bold and italic markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Strip inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Strip blockquote markers
    .replace(/^\s*>\s*/gm, '')
    // Strip bullet markers (*, -, +)
    .replace(/^\s*[*+-]\s+/gm, '')
    // Clean numbered list markers to natural speech e.g. "1. " -> "1. "
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
    // Strip horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Strip emojis so TTS doesn't read out emoji descriptions
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Collapse excess whitespace and newlines into natural pauses
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useVoiceInteraction() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const preferredVoiceRef = useRef<{ language: string; voice?: string }>({
    language: 'en-NG',
  });

  // Web Speech API references if running in web/hybrid environment
  const recognitionRef = useRef<any>(null);

  // Discover Nigerian English (en-NG) voice on device if installed, else fallback to en
  useEffect(() => {
    let mounted = true;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (!mounted || !voices?.length) return;
        const ngVoice = voices.find((v) =>
          v.language?.toLowerCase().includes('en-ng') ||
          v.identifier?.toLowerCase().includes('en-ng') ||
          v.identifier?.toLowerCase().includes('en_ng'),
        );
        if (ngVoice) {
          preferredVoiceRef.current = {
            language: ngVoice.language || 'en-NG',
            voice: ngVoice.identifier,
          };
        } else {
          preferredVoiceRef.current = { language: 'en' };
        }
      })
      .catch(() => {
        preferredVoiceRef.current = { language: 'en' };
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop();
    } catch {
      // Ignore stop error
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
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

      // Toggle off if currently speaking the same message
      if (isSpeaking && activeSpeechId === messageId) {
        stopSpeaking();
        return;
      }

      // Stop any current speech before starting new one
      stopSpeaking();

      const cleanSpeechText = cleanMarkdownForSpeech(text);
      if (!cleanSpeechText) return;

      setIsSpeaking(true);
      setActiveSpeechId(messageId);

      try {
        Speech.speak(cleanSpeechText, {
          language: preferredVoiceRef.current.language,
          ...(preferredVoiceRef.current.voice
            ? { voice: preferredVoiceRef.current.voice }
            : {}),
          pitch: 1.0,
          rate: 0.96,
          onStart: () => {
            setIsSpeaking(true);
            setActiveSpeechId(messageId);
            onStart?.();
          },
          onDone: () => {
            setIsSpeaking(false);
            setActiveSpeechId(null);
            onDone?.();
          },
          onStopped: () => {
            setIsSpeaking(false);
            setActiveSpeechId(null);
          },
          onError: () => {
            setIsSpeaking(false);
            setActiveSpeechId(null);
          },
        });
      } catch (err) {
        // Fallback for web if expo-speech doesn't trigger
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          'speechSynthesis' in window
        ) {
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
          setIsSpeaking(false);
          setActiveSpeechId(null);
        }
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
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
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
