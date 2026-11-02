import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  MessageSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  History,
  GraduationCap,
  Mic,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { useTheme } from '@/shared/hooks/useTheme';

export default function StudyBuddyScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <ScreenWrapper scroll>
      <View className="mb-6 mt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-inter-bold text-slate-900 dark:text-slate-50">
              Study Buddy
            </Text>
            <Text className="text-base font-inter-regular text-slate-500 mt-0.5">
              Your 24/7 AI Senior Coursemate 🇳🇬
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View past study chats"
            onPress={() => navigation.navigate('StudyRoomHistory')}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
          >
            <History size={19} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Welcome Card */}
      <View className="mb-6 overflow-hidden rounded-3xl shadow-sm">
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Users size={28} color="#FFFFFF" />
            </View>
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-[11px] font-inter-bold tracking-wider text-white">
                🇳🇬 PIDGIN & ENGLISH
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-2xl font-inter-bold text-white">
            Meet Your Sabi Study Buddy
          </Text>
          <Text className="mt-2 text-sm leading-5 font-inter-medium text-white/85">
            Like a smart senior coursemate who never gets tired of questions. Grounded strictly in your lecture notes, handouts, and slides.
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('StudyRoomSetup')}
            activeOpacity={0.85}
            className="mt-6 flex-row items-center justify-center rounded-2xl bg-white py-3.5 px-4 shadow-sm"
          >
            <Sparkles size={17} color="#4F46E5" />
            <Text className="ml-2 font-inter-bold text-indigo-700 text-sm">
              Start a Study Session
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* How it Works / Feature Highlights */}
      <Text className="mb-3 text-lg font-inter-bold text-slate-900 dark:text-slate-50">
        How Your Study Buddy Helps You
      </Text>

      <View className="mb-6 gap-3">
        <View className="flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800">
          <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Mic size={22} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm">
              Adaptive Pidgin & English
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 leading-4">
              Chat or listen in plain English or natural Nigerian Pidgin with relatable everyday analogies.
            </Text>
          </View>
        </View>

        <View className="flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800">
          <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <BookOpen size={22} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm">
              Source-Grounded Answers
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 leading-4">
              No hallucinations. Answers reference page-level citations from your exact uploaded handouts.
            </Text>
          </View>
        </View>

        <View className="flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800">
          <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
            <GraduationCap size={22} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm">
              Quick Practice & Quizzing
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 leading-4">
              Ask your buddy to test you on any chapter, or explain why an answer was wrong in a test.
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Cards */}
      <View className="mb-8 flex-row gap-3">
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyRoomHistory')}
          activeOpacity={0.8}
          className="flex-1 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800"
        >
          <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
            <History size={18} color={colors.textSecondary} />
          </View>
          <Text className="font-inter-semibold text-slate-900 dark:text-slate-50 text-xs">
            Past Study Chats
          </Text>
          <Text className="mt-0.5 text-[11px] text-slate-500">
            Resume saved sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('UploadMaterial')}
          activeOpacity={0.8}
          className="flex-1 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800"
        >
          <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
            <BookOpen size={18} color={colors.textSecondary} />
          </View>
          <Text className="font-inter-semibold text-slate-900 dark:text-slate-50 text-xs">
            Add Handouts
          </Text>
          <Text className="mt-0.5 text-[11px] text-slate-500">
            Upload PDF or images
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
