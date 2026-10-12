import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  Send,
  Square,
  Sparkles,
  BookOpen,
  Info,
  Mic,
  MicOff,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { useTheme } from '@/shared/hooks/useTheme';
import { useStudySession } from '../hooks/useStudyRoom';
import { useVoiceInteraction } from '../hooks/useVoiceInteraction';
import { studyRoomApi } from '../services/study-room.api';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { SourceCitationModal } from '../components/SourceCitationModal';
import {
  StudyMessage,
  SourceCitation,
} from '../types/study-room.types';
import type { MainStackParamList } from '@/navigation/types';

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

  const {
    isListening,
    activeSpeechId,
    speakText,
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

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputQuery).trim();
    if (!query || isGenerating) return;

    setInputQuery('');
    const tempUserMessage: StudyMessage = {
      id: `temp-u-${Date.now()}`,
      sessionId,
      role: 'USER',
      content: query,
      status: 'COMPLETED',
      inputMode: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMessage: StudyMessage = {
      id: `temp-a-${Date.now()}`,
      sessionId,
      role: 'ASSISTANT',
      content: '',
      sources: null,
      status: 'PENDING',
      inputMode: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    await studyRoomApi.streamMessage(
      sessionId,
      { content: query },
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
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <ChevronLeft size={22} color="#64748B" />
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

            <TouchableOpacity
              onPress={() => setShowMaterialSheet((v) => !v)}
              className="h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40"
              accessibilityRole="button"
              accessibilityLabel="Selected materials information"
            >
              <Info size={18} color={colors.primary} />
            </TouchableOpacity>
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
                // tintColor: isDark ? '#000000' : '#0F172A',
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
            renderItem={({ item, index }) => (
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
                  <Sparkles size={32} color={colors.primary} />
                </View>
                <Text className="mb-1 text-center text-xl font-inter-bold text-slate-900 dark:text-slate-50">
                  Your AI Study Room is Ready
                </Text>
                <Text className="mb-8 text-center text-xs font-inter-regular leading-relaxed text-slate-500">
                  Ask questions about your uploaded lecture materials. Answers will cite verified page and section excerpts.
                </Text>

                {/* Starter prompts */}
                <View className="w-full gap-2.5">
                  {[
                    // 'What are the key themes and takeaways in this course material?',
                    // 'Explain the most challenging concept from the course material.',
                    // 'Can you list the key terms and their definitions?',
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

        {/* Bottom Input Bar */}
        <View className="mb-10 border-t border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-800/80">
              <TextInput
                placeholder="Ask about your study material..."
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
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
