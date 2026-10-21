import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Radio,
  Square,
} from 'lucide-react-native';

interface LiveStudyStreamModalProps {
  visible: boolean;
  sessionTitle: string;
  isGenerating: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  latestAssistantText: string;
  onClose: () => void;
  onSendLivePrompt: (prompt: string) => void;
  onStartListening: (onTranscript: (text: string) => void) => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onStopGenerating: () => void;
}

const QUICK_VOICE_PROMPTS = [
  'Abeg break down the main gist of this handout in Pidgin!',
  'Give me a funny Naija analogy for the hardest topic here.',
  'Test my brain with one quick question from this note!',
];

export function LiveStudyStreamModal({
  visible,
  sessionTitle,
  isGenerating,
  isSpeaking,
  isListening,
  latestAssistantText,
  onClose,
  onSendLivePrompt,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onStopGenerating,
}: LiveStudyStreamModalProps) {
  const [liveInput, setLiveInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const outerRingAnim = useRef(new Animated.Value(1)).current;

  const mode: 'listening' | 'thinking' | 'speaking' | 'idle' = isListening
    ? 'listening'
    : isGenerating
      ? 'thinking'
      : isSpeaking
        ? 'speaking'
        : 'idle';

  useEffect(() => {
    if (!visible) {
      pulseAnim.stopAnimation();
      outerRingAnim.stopAnimation();
      return;
    }

    const duration =
      mode === 'speaking'
        ? 550
        : mode === 'thinking'
          ? 700
          : mode === 'listening'
            ? 650
            : 1600;
    const maxScale =
      mode === 'speaking'
        ? 1.24
        : mode === 'listening'
          ? 1.2
          : mode === 'thinking'
            ? 1.15
            : 1.06;

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: maxScale,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(outerRingAnim, {
            toValue: maxScale + 0.18,
            duration: duration * 1.1,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(outerRingAnim, {
            toValue: 1,
            duration: duration * 1.1,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [visible, mode, pulseAnim, outerRingAnim]);

  const handleSend = (text?: string) => {
    const query = (text ?? liveInput).trim();
    if (!query || isGenerating) return;
    setLiveInput('');
    if (isSpeaking) {
      onStopSpeaking();
    }
    onSendLivePrompt(query);
  };

  const statusLabel =
    mode === 'listening'
      ? 'Listening to you...'
      : mode === 'thinking'
        ? 'SlotStudy AI dey cook answer...'
        : mode === 'speaking'
          ? 'SlotStudy AI is speaking live...'
          : 'Tap Mic or select a prompt to yarn with AI';

  const orbColorClass =
    mode === 'listening'
      ? 'bg-red-500'
      : mode === 'thinking'
        ? 'bg-amber-500'
        : mode === 'speaking'
          ? 'bg-emerald-500'
          : 'bg-blue-600';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-slate-950"
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
          <View className="flex-row items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 border border-emerald-500/30">
            <Radio size={14} color="#10B981" />
            <Text className="text-xs font-inter-bold text-emerald-400">
              LIVE AI STREAM
            </Text>
          </View>

          <Text
            numberOfLines={1}
            className="flex-1 px-3 text-center text-xs font-inter-medium text-slate-400"
          >
            {sessionTitle}
          </Text>

          <TouchableOpacity
            onPress={() => {
              onStopSpeaking();
              onStopListening();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="End live stream"
            className="rounded-full bg-slate-800 px-3.5 py-1.5"
          >
            <Text className="text-xs font-inter-bold text-slate-300">
              Minimize
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Animated AI Voice Orb & Live Captions */}
        <View className="flex-1 items-center justify-center px-6">
          <View className="my-6 items-center justify-center">
            <Animated.View
              style={{
                transform: [{ scale: outerRingAnim }],
                opacity: 0.18,
              }}
              className={`absolute h-52 w-52 rounded-full ${orbColorClass}`}
            />
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
                opacity: 0.32,
              }}
              className={`absolute h-40 w-40 rounded-full ${orbColorClass}`}
            />
            <View
              className={`h-28 w-28 items-center justify-center rounded-full shadow-lg ${orbColorClass}`}
            >
              <Sparkles size={40} color="#FFFFFF" />
            </View>
          </View>

          <Text className="mt-4 text-center text-base font-inter-bold text-white">
            {statusLabel}
          </Text>
          <Text className="mt-1 text-center text-xs font-inter-regular text-slate-400">
            Adaptive Naija Study Buddy • Grounded in your course materials
          </Text>

          {/* Live Caption Transcript Box */}
          <ScrollView
            className="mt-5 max-h-48 w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-4"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <Text className="text-center text-sm font-inter-regular leading-relaxed text-slate-200">
              {latestAssistantText
                ? latestAssistantText
                : 'How far scholar! Oya ask me anything from your handout — whether na English or Pidgin, make we scatter this course together! 🔥'}
            </Text>
          </ScrollView>

          {/* Quick Voice Prompts */}
          <View className="mt-4 w-full gap-2">
            {QUICK_VOICE_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                disabled={isGenerating}
                onPress={() => handleSend(prompt)}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5"
              >
                <Text
                  numberOfLines={1}
                  className="text-xs font-inter-medium text-blue-400"
                >
                  🎙️ "{prompt}"
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Live Input & Call Controls */}
        <View className="border-t border-slate-800/80 bg-slate-900/95 px-5 pt-3 pb-10">
          {/* Quick text/dictation bar */}
          <View className="mb-4 flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-1">
              <TextInput
                placeholder="Speak or type to your live study buddy..."
                placeholderTextColor="#64748B"
                value={liveInput}
                onChangeText={setLiveInput}
                onSubmitEditing={() => handleSend()}
                className="flex-1 py-2 text-sm font-inter-regular text-white"
              />
            </View>
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!liveInput.trim() || isGenerating}
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                liveInput.trim() && !isGenerating
                  ? 'bg-blue-600'
                  : 'bg-slate-800'
              }`}
            >
              <Send
                size={18}
                color={liveInput.trim() && !isGenerating ? '#FFFFFF' : '#475569'}
              />
            </TouchableOpacity>
          </View>

          {/* Voice Call Action Buttons */}
          <View className="flex-row items-center justify-around">
            {/* Mute / Unmute AI Voice */}
            <TouchableOpacity
              onPress={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (nextMuted && isSpeaking) {
                  onStopSpeaking();
                }
              }}
              className={`h-14 w-14 items-center justify-center rounded-full ${
                isMuted ? 'bg-amber-500/20 border border-amber-500' : 'bg-slate-800'
              }`}
            >
              {isMuted ? (
                <VolumeX size={22} color="#F59E0B" />
              ) : (
                <Volume2 size={22} color="#E2E8F0" />
              )}
            </TouchableOpacity>

            {/* Primary Mic / Interrupt Button */}
            {isGenerating || isSpeaking ? (
              <TouchableOpacity
                onPress={() => {
                  if (isGenerating) onStopGenerating();
                  if (isSpeaking) onStopSpeaking();
                }}
                className="h-16 w-16 items-center justify-center rounded-full bg-amber-500 shadow-lg"
              >
                <Square size={24} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (isListening) {
                    onStopListening();
                  } else {
                    onStartListening((transcript) => {
                      setLiveInput(transcript);
                    });
                  }
                }}
                className={`h-16 w-16 items-center justify-center rounded-full shadow-lg ${
                  isListening ? 'bg-red-500' : 'bg-blue-600'
                }`}
              >
                {isListening ? (
                  <MicOff size={26} color="#FFFFFF" />
                ) : (
                  <Mic size={26} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}

            {/* End Live Stream Session */}
            <TouchableOpacity
              onPress={() => {
                onStopSpeaking();
                onStopListening();
                onClose();
              }}
              className="h-14 w-14 items-center justify-center rounded-full bg-red-600"
            >
              <PhoneOff size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
