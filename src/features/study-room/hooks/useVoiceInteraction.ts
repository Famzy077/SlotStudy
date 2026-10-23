import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Strip markdown syntax, citations, emojis, and symbols so TTS reads with crystal-clear,
 * natural speech that is easy to understand without looking at the text.
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
    // Prevent standalone Pidgin "E" from being read as "Letter E"
    .replace(/\bE\s+(dey|be|choke|soft|don|go|fit|no|sweet|hard|reach)\b/g, 'Eh $1')
    // Collapse excess whitespace and newlines into clear sentence pauses
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ResolvedVoiceConfig {
  language: string;
  voice?: string;
  pitch: number;
  rate: number;
  resolved: boolean;
}

/**
 * Known Male voice identifiers across Android (Google TTS), iOS (Apple), and Web (Edge/Chrome):
 * - Microsoft/Edge African Male: abeo (Nigeria), chilemba (Kenya), eliminu (Tanzania), themba (South Africa)
 * - Google TTS Android Male codes: iom, tpd, sfg, iob, iol, rjs, gbd, fis, aub, aud, end, ene, #male
 * - Apple iOS Male voices: daniel, arthur, aaron, fred, gordon, rishi, oliver, reed, rocko, eddy
 */
const MALE_VOICE_PATTERN =
  /(abeo|chilemba|eliminu|themba|#male|\bmale\b|-iom|-tpd|-sfg|-iob|-iol|-rjs|-gbd|-fis|-aub|-aud|-end|-ene|daniel|david|james|aaron|fred|arthur|gordon|guy|mark|alex|reed|rocko|eddy|oliver|rishi|albert|thomas)/i;

/**
 * Known Female voice identifiers to strictly exclude (including Android's default female en-ng-x-tfn):
 */
const FEMALE_VOICE_PATTERN =
  /(ezinne|zinzi|wanjiku|rehema|-tfn|-sfb|-sfc|-tpc|-tpf|-iog|-gba|-gbc|-aua|-auc|-ena|-enc|#female|\bfemale\b|samantha|victoria|karen|moira|tessa|zoe|ava|allison|susan|zira|hazel|heera|catherine|martha|nicky|fiona)/i;

const NIGERIAN_LOCALE_PATTERN = /(en[-_]ng|nigeria)/i;
const AFRICAN_LOCALE_PATTERN =
  /(en[-_](ng|gh|ke|tz|za|ug|zm|zw|cm|rw)|nigeria|ghana|kenya|tanzania|africa)/i;

function selectClearMaleVoice(voices: Speech.Voice[]): ResolvedVoiceConfig {
  const meta = (v: Speech.Voice) =>
    `${v.identifier || ''} ${v.name || ''} ${v.language || ''}`;

  // 1. Best: Nigerian (en-NG) explicitly Male voice (e.g. Abeo or Android en-NG male)
  const ngMale = voices.find(
    (v) =>
      NIGERIAN_LOCALE_PATTERN.test(meta(v)) &&
      MALE_VOICE_PATTERN.test(meta(v)) &&
      !FEMALE_VOICE_PATTERN.test(meta(v)),
  );
  if (ngMale) {
    return {
      language: ngMale.language || 'en-NG',
      voice: ngMale.identifier,
      pitch: 0.96,
      rate: 0.94,
      resolved: true,
    };
  }

  // 2. African (Ghana, Kenya, Tanzania, South Africa) explicitly Male voice
  const africanMale = voices.find(
    (v) =>
      AFRICAN_LOCALE_PATTERN.test(meta(v)) &&
      MALE_VOICE_PATTERN.test(meta(v)) &&
      !FEMALE_VOICE_PATTERN.test(meta(v)),
  );
  if (africanMale) {
    return {
      language: africanMale.language || 'en-NG',
      voice: africanMale.identifier,
      pitch: 0.95,
      rate: 0.94,
      resolved: true,
    };
  }

  // 3. Nigerian (en-NG) voice that is NOT a known female voice (excludes -tfn and ezinne)
  const ngNonFemale = voices.find(
    (v) =>
      NIGERIAN_LOCALE_PATTERN.test(meta(v)) &&
      !FEMALE_VOICE_PATTERN.test(meta(v)),
  );
  if (ngNonFemale) {
    return {
      language: ngNonFemale.language || 'en-NG',
      voice: ngNonFemale.identifier,
      pitch: 0.92,
      rate: 0.94,
      resolved: true,
    };
  }

  // 4. Crystal-clear native English Male voice (preferring non-US Commonwealth/deep male voices like rjs, gbd, daniel, iom, tpd)
  const preferredMaleOrder = [
    /(-rjs|-gbd|-fis|daniel|arthur|oliver)/i,
    /(-end|-ene|-aub|-aud|rishi|gordon)/i,
    /(-iom|-tpd|-sfg|-iob|-iol|aaron|fred|david|james|guy|mark|alex|reed|rocko|eddy)/i,
    MALE_VOICE_PATTERN,
  ];

  for (const pattern of preferredMaleOrder) {
    const maleVoice = voices.find(
      (v) =>
        /^en/i.test(v.language || '') &&
        pattern.test(meta(v)) &&
        !FEMALE_VOICE_PATTERN.test(meta(v)),
    );
    if (maleVoice) {
      return {
        language: maleVoice.language || 'en-NG',
        voice: maleVoice.identifier,
        pitch: 0.92,
        rate: 0.94,
        resolved: true,
      };
    }
  }

  // 5. Fallback if device doesn't expose male voice tags: use moderate masculine pitch (0.85) so speech stays crisp and clear
  return {
    language: 'en-NG',
    pitch: 0.85,
    rate: 0.94,
    resolved: voices.length > 0,
  };
}

export function useVoiceInteraction() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const preferredVoiceRef = useRef<ResolvedVoiceConfig>({
    language: 'en-NG',
    pitch: 0.92,
    rate: 0.94,
    resolved: false,
  });

  // Web Speech API references if running in web/hybrid environment
  const recognitionRef = useRef<any>(null);

  const ensureVoiceResolved = useCallback(async (): Promise<ResolvedVoiceConfig> => {
    if (preferredVoiceRef.current.resolved) {
      return preferredVoiceRef.current;
    }
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (voices && voices.length > 0) {
        preferredVoiceRef.current = selectClearMaleVoice(voices);
      }
    } catch {
      // Keep default config
    }
    return preferredVoiceRef.current;
  }, []);

  // Pre-warm voice selection on mount
  useEffect(() => {
    void ensureVoiceResolved();
  }, [ensureVoiceResolved]);

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

  // Speak AI answer with Nigerian / African Male Voice
  const speakText = useCallback(
    async (
      text: string,
      messageId: string,
      onStart?: () => void,
      onDone?: () => void,
    ) => {
      if (!text || !text.trim()) return;

      // Toggle off if currently speaking the same message
      if (isSpeaking && activeSpeechId === messageId) {
        await stopSpeaking();
        return;
      }

      // Stop any current speech before starting new one
      await stopSpeaking();

      const cleanSpeechText = cleanMarkdownForSpeech(text);
      if (!cleanSpeechText) return;

      const voiceConfig = await ensureVoiceResolved();

      setIsSpeaking(true);
      setActiveSpeechId(messageId);

      try {
        Speech.speak(cleanSpeechText, {
          language: voiceConfig.language,
          ...(voiceConfig.voice ? { voice: voiceConfig.voice } : {}),
          pitch: voiceConfig.pitch,
          rate: voiceConfig.rate,
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
          utterance.lang = 'en-NG';
          utterance.rate = voiceConfig.rate;
          utterance.pitch = voiceConfig.pitch;

          const webVoices = window.speechSynthesis.getVoices();
          const ngMaleWeb =
            webVoices.find(
              (v) =>
                NIGERIAN_LOCALE_PATTERN.test(`${v.lang} ${v.name}`) &&
                MALE_VOICE_PATTERN.test(v.name),
            ) ||
            webVoices.find((v) =>
              AFRICAN_LOCALE_PATTERN.test(`${v.lang} ${v.name}`),
            );
          if (ngMaleWeb) {
            utterance.voice = ngMaleWeb;
          }

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
    [isSpeaking, activeSpeechId, stopSpeaking, ensureVoiceResolved],
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
