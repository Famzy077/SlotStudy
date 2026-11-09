import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  Send,
  Square,
  GraduationCap,
  BookOpen,
  Info,
  Mic,
  MicOff,
  Radio,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { AppAlert } from '@/shared/components/feedback/AppAlert';
import { useTheme } from '@/shared/hooks/useTheme';
import { useStudySession } from '../hooks/useStudyRoom';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';
import { studyRoomApi } from '../services/study-room.api';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { SourceCitationModal } from '../components/SourceCitationModal';
import { LiveStudyStreamModal } from '../components/LiveStudyStreamModal';
import {
  StudyMessage,
  SourceCitation,
} from '../types/study-room.types';
import type { MainStackParamList } from '@/navigation/types';

/**
 * Set to `false` while testing Live AI Stream.
 * Set to `true` after testing so clicking the Live button shows "Live stream is coming soon".
 */
const LIVE_STREAM_COMING_SOON = true;

const QUICK_ACTION_CHIPS = [
  {
    label: '🇳🇬 Explain in Pidgin',
    prompt: 'Abeg break down this concept for me in Nigerian Pidgin!',
  },
  {
    label: '💡 Naija Analogy',
    prompt: 'Give me a relatable everyday Nigerian analogy for this topic.',
  },
  {
    label: '🎯 Quiz Me',
    prompt: 'Test my brain with one quick exam question from this material!',
  },
  {
    label: '📝 Key Takeaways',
    prompt: 'What are the top exam takeaways I must remember from this material?',
  },
];

export default function StudyRoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainStackParamList, 'StudyRoom'>>();
  const sessionId = route.params.sessionId;
  const { colors, isDark } = useTheme();

  const { data: sessionResponse, isLoading, refetch } = useStudySession(sessionId);
  const session = sessionResponse?.data;

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSources, setActiveSources] = useState<SourceCitation[]>([]);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [showMaterialSheet, setShowMaterialSheet] = useState(false);
  const [liveStreamModalVisible, setLiveStreamModalVisible] = useState(false);

  const {
    isSpeaking,
    isListening,
    activeSpeechId,
    speakText,
    stopSpeaking,
    startListening,
    stopListening,
  } = useVoiceInteraction();

  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initial messages from session
  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages);
    }
  }, [session?.messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isGenerating]);

  const handlePressLiveStream = () => {
    if (LIVE_STREAM_COMING_SOON) {
      AppAlert.alert(
        'Live Stream Coming Soon 🎙️',
        'Live voice streaming with your SlotStudy AI study buddy is coming soon! Stay tuned.',
      );
      return;
    }
    setLiveStreamModalVisible(true);
  };

  const handleSendMessage = async (textToSend?: string, autoSpeak = false) => {
    const query = (textToSend ?? inputQuery).trim();
    if (!query || isGenerating) return;

    setInputQuery('');
    const tempUserMessage: StudyMessage = {
      id: `temp-u-${Date.now()}`,
      sessionId,
      role: 'USER',
      content: query,
      status: 'COMPLETED',
      inputMode: autoSpeak ? 'VOICE' : 'TEXT',
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMessage: StudyMessage = {
      id: `temp-a-${Date.now()}`,
      sessionId,
      role: 'ASSISTANT',
      content: '',
      sources: null,
      status: 'PENDING',
      inputMode: autoSpeak ? 'VOICE' : 'TEXT',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    await studyRoomApi.streamMessage(
      sessionId,
      { content: query, inputMode: autoSpeak ? 'VOICE' : 'TEXT' },
      {
        onUserMessage: (confirmedMsg) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempUserMessage.id ? confirmedMsg : m)),
          );
        },
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMessage.id ? { ...m, sources } : m,
            ),
          );
        },
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMessage.id
                ? { ...m, content: accumulatedContent }
                : m,
            ),
          );
        },
        onDone: (finalMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMessage.id ? finalMsg : m,
            ),
          );
          setIsGenerating(false);
          abortControllerRef.current = null;
          if (autoSpeak && finalMsg?.content) {
            speakText(finalMsg.content, finalMsg.id);
          }
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMessage.id
                ? {
                  ...m,
                  content:
                    accumulatedContent ||
                    'Could not generate an answer from the selected study materials. Please try again.',
                  status: 'FAILED',
                }
                : m,
            ),
          );
          setIsGenerating(false);
          abortControllerRef.current = null;
        },
      },
      abortController.signal,
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleOpenSources = (sources: SourceCitation[]) => {
    setActiveSources(sources);
    setSourcesModalVisible(true);
  };

  if (isLoading) {
    return (
      <ScreenWrapper scroll={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm font-inter-medium text-slate-500">
            Entering Study Room...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const materialsList = session?.materials.map((m) => m.material) ?? [];
  const latestAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === 'ASSISTANT');

  return (
    <ScreenWrapper scroll={false} padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="border-b border-slate-100 bg-white px-5 pb-3 pt-2 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="flex-row items-center gap-1 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800"
            >
              <ChevronLeft size={18} color="#64748B" />
              <Text className="text-xs font-inter-bold text-slate-700 dark:text-slate-200">
                Back
              </Text>
            </TouchableOpacity>

            <View className="flex-1 px-3">
              <Text
                numberOfLines={1}
                className="text-base font-inter-bold text-slate-900 dark:text-slate-50"
              >
                {session?.title || 'AI Study Room'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowMaterialSheet((v) => !v)}
                className="flex-row items-center gap-1.5"
              >
                <BookOpen size={12} color={colors.primary} />
                <Text className="text-xs font-inter-medium text-primary">
                  {materialsList.length} verified {materialsList.length === 1 ? 'material' : 'materials'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handlePressLiveStream}
                accessibilityRole="button"
                accessibilityLabel="Live stream with AI"
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  LIVE_STREAM_COMING_SOON
                    ? 'border border-amber-500/30 bg-amber-500/10'
                    : 'border border-emerald-500/30 bg-emerald-500/15'
                }`}
              >
                <Radio
                  size={14}
                  color={LIVE_STREAM_COMING_SOON ? '#F59E0B' : '#10B981'}
                />
                <Text
                  className={`text-xs font-inter-bold ${
                    LIVE_STREAM_COMING_SOON
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {LIVE_STREAM_COMING_SOON ? 'Live • Soon' : 'Live'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowMaterialSheet((v) => !v)}
                className="h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40"
                accessibilityRole="button"
                accessibilityLabel="Selected materials information"
              >
                <Info size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick materials list accordion if toggled */}
          {showMaterialSheet && (
            <View className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
              <Text className="mb-1 text-xs font-inter-bold text-slate-700 dark:text-slate-300">
                Grounding Evidence Sources:
              </Text>
              {materialsList.map((m) => (
                <Text
                  key={m.id}
                  numberOfLines={1}
                  className="text-xs font-inter-regular text-slate-500 dark:text-slate-400"
                >
                  • {m.fileName}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Chat Feed Area with SlotStudy Watermark */}
        <View className="relative flex-1">
          {/* Subtle Dark Background Watermark */}
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
            style={{ zIndex: 0 }}
          >
            <Image
              source={require('../../../../assets/images/logo.png')}
              resizeMode="contain"
              style={{
                width: 260,
                height: 180,
                opacity: isDark ? 0.05 : 0.04,
              }}
            />
          </View>

          {/* Message Feed */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 24,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <ChatMessageBubble
                message={item}
                isStreaming={
                  isGenerating &&
                  index === messages.length - 1 &&
                  item.role === 'ASSISTANT'
                }
                onPressSources={handleOpenSources}
                onRetry={() => handleSendMessage(item.content)}
                onSpeak={() => speakText(item.content, item.id)}
                isSpeaking={activeSpeechId === item.id}
              />
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-4 py-12">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-900/40">
                  <GraduationCap size={32} color={colors.primary} />
                </View>
                <Text className="mb-1 text-center text-xl font-inter-bold text-slate-900 dark:text-slate-50">
                  Your AI Study Room is Ready
                </Text>
                <Text className="mb-8 text-center text-xs font-inter-regular leading-relaxed text-slate-500">
                  Chat in English or Nigerian Pidgin! Your AI study buddy will break down your materials with cited sources.
                </Text>

                {/* Starter prompts */}
                <View className="w-full gap-2.5">
                  {[
                    'Abeg senior man, break down the main gist of this handout for me!',
                    'Explain the most challenging concept here with a relatable example.',
                    'Can you list the key terms and definitions from this material?',
                  ].map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage(prompt)}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/80"
                    >
                      <Text className="text-xs font-inter-medium text-slate-700 dark:text-slate-200">
                        💡 "{prompt}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />
        </View>

        {/* Bottom Input Bar + Quick Action Chips */}
        <View className="mb-10 border-t border-slate-100 bg-white pt-2.5 pb-3.5 px-3.5 dark:border-slate-800 dark:bg-slate-900">
          {/* 1-Tap Quick Action Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {QUICK_ACTION_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                disabled={isGenerating}
                onPress={() => handleSendMessage(chip.prompt)}
                className="rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
              >
                <Text className="text-xs font-inter-semibold text-primary dark:text-blue-400">
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-800/80">
              <TextInput
                placeholder="Ask in English or Pidgin..."
                placeholderTextColor="#94A3B8"
                value={inputQuery}
                onChangeText={setInputQuery}
                multiline
                style={{ maxHeight: 100 }}
                className="flex-1 text-[15px] py-2 min-h-[36px] font-inter-regular text-slate-900 dark:text-slate-100"
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening((transcript) => {
                    setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
                  });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isListening ? "Stop voice listening" : "Dictate question"}
              className={`h-11 w-11 items-center justify-center rounded-2xl ${isListening
                ? 'bg-red-500'
                : 'bg-slate-100 dark:bg-slate-800'
                }`}
            >
              {isListening ? (
                <MicOff size={18} color="#FFFFFF" />
              ) : (
                <Mic size={18} color="#64748B" />
              )}
            </TouchableOpacity>

            {isGenerating ? (
              <TouchableOpacity
                onPress={handleStopGeneration}
                accessibilityRole="button"
                accessibilityLabel="Stop generating response"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-red-500"
              >
                <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleSendMessage()}
                disabled={!inputQuery.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send question"
                className={`h-11 w-11 items-center justify-center rounded-2xl ${inputQuery.trim() ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
              >
                <Send
                  size={18}
                  color={inputQuery.trim() ? '#FFFFFF' : '#94A3B8'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Citations Modal */}
        <SourceCitationModal
          visible={sourcesModalVisible}
          onClose={() => setSourcesModalVisible(false)}
          sources={activeSources}
        />

        {/* Live AI Stream Modal */}
        <LiveStudyStreamModal
          visible={liveStreamModalVisible}
          sessionTitle={session?.title || 'AI Study Room'}
          isGenerating={isGenerating}
          isSpeaking={isSpeaking}
          isListening={isListening}
          latestAssistantText={latestAssistantMsg?.content ?? ''}
          onClose={() => setLiveStreamModalVisible(false)}
          onSendLivePrompt={(prompt) => handleSendMessage(prompt, true)}
          onStartListening={startListening}
          onStopListening={stopListening}
          onStopSpeaking={stopSpeaking}
          onStopGenerating={handleStopGeneration}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
