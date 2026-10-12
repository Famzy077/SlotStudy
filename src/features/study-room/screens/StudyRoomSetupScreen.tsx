import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  History,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { AppAlert as Alert } from '@/shared/components/feedback/AppAlert';
import { useTheme } from '@/shared/hooks/useTheme';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { useMaterials } from '@/features/ai/hooks/useUpload';
import { useCreateStudySession } from '../hooks/useStudyRoom';
import type { MainStackParamList } from '@/navigation/types';

export default function StudyRoomSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainStackParamList, 'StudyRoomSetup'>>();
  const { colors } = useTheme();

  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(
    route.params?.courseId,
  );
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>(
    route.params?.materialId ? [route.params.materialId] : [],
  );
  const [title, setTitle] = useState('');

  const { data: coursesResponse, isLoading: coursesLoading } = useCourses();
  const { data: materialsResponse, isLoading: materialsLoading } =
    useMaterials(selectedCourseId);
  const createSessionMutation = useCreateStudySession();

  const courses = coursesResponse?.data ?? [];
  const materials = materialsResponse?.data ?? [];

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  };

  const handleCreateSession = () => {
    if (selectedMaterialIds.length === 0) {
      Alert.alert(
        'Select Material',
        'Please select at least one study material to ground your AI study session.',
      );
      return;
    }

    createSessionMutation.mutate(
      {
        courseId: selectedCourseId,
        materialIds: selectedMaterialIds,
        title: title.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            navigation.replace('StudyRoom', { sessionId: res.data.id });
          }
        },
        onError: (err) => {
          Alert.alert(
            'Could not create session',
            err instanceof Error ? err.message : 'Please try again.',
          );
        },
      },
    );
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 px-6 pb-4 pt-2 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-lg font-inter-bold text-slate-900 dark:text-slate-50">
          New AI Study Room
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyRoomHistory')}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          accessibilityRole="button"
          accessibilityLabel="Session history"
        >
          <History size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner */}
        <View className="mb-6 rounded-3xl bg-blue-50/80 p-5 dark:bg-blue-900/20">
          <View className="flex-row items-center gap-2.5">
            <Sparkles size={20} color={colors.primary} />
            <Text className="text-base font-inter-bold text-primary">
              Strictly Grounded Learning
            </Text>
          </View>
          <Text className="mt-1.5 text-xs font-inter-regular leading-relaxed text-slate-600 dark:text-slate-300">
            Answers are restricted solely to the materials you select below. No outside guesses or web hallucinations.
          </Text>
        </View>

        {/* Step 1: Optional Course filter */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-inter-semibold text-slate-900 dark:text-slate-50">
            1. Select Course
          </Text>
          {coursesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCourseId(undefined)}
                className={`rounded-2xl px-4 py-2.5 ${selectedCourseId === undefined
                  ? 'bg-primary'
                  : 'bg-slate-100 dark:bg-slate-800'
                  }`}
              >
                <Text
                  className={`text-xs font-inter-medium ${selectedCourseId === undefined
                    ? 'text-white'
                    : 'text-slate-700 dark:text-slate-300'
                    }`}
                >
                  All Courses
                </Text>
              </TouchableOpacity>
              {courses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                return (
                  <TouchableOpacity
                    key={course.id}
                    onPress={() => setSelectedCourseId(course.id)}
                    className={`rounded-2xl px-4 py-2.5 ${isSelected
                      ? 'bg-primary'
                      : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                  >
                    <Text
                      className={`text-xs font-inter-medium ${isSelected
                        ? 'text-white'
                        : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Step 2: Select Materials */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-inter-semibold text-slate-900 dark:text-slate-50">
              2. Select Study Materials *
            </Text>
            <Text className="text-xs font-inter-medium text-primary">
              {selectedMaterialIds.length} selected
            </Text>
          </View>

          {materialsLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : materials.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-slate-200 p-6 dark:border-slate-800">
              <FileText size={32} color="#94A3B8" />
              <Text className="mt-2 text-center text-sm font-inter-medium text-slate-600 dark:text-slate-400">
                No materials available yet.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('UploadMaterial', {})}
                className="mt-3 rounded-xl bg-primary/10 px-4 py-2"
              >
                <Text className="text-xs font-inter-semibold text-primary">
                  Upload Materials First
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {materials.map((material) => {
                const isSelected = selectedMaterialIds.includes(material.id);
                return (
                  <TouchableOpacity
                    key={material.id}
                    activeOpacity={0.8}
                    onPress={() => toggleMaterial(material.id)}
                    className={`flex-row items-center justify-between rounded-2xl border p-4 ${isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-800'
                      }`}
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${isSelected
                          ? 'bg-primary'
                          : 'bg-slate-100 dark:bg-slate-700'
                          }`}
                      >
                        <FileText
                          size={20}
                          color={isSelected ? '#FFFFFF' : '#64748B'}
                        />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          numberOfLines={1}
                          className="text-sm font-inter-semibold text-slate-900 dark:text-slate-100"
                        >
                          {material.fileName}
                        </Text>
                        <Text className="text-xs font-inter-regular text-slate-400">
                          {material.fileType.split('/')[1]?.toUpperCase() ?? 'DOC'}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border ${isSelected
                        ? 'border-primary bg-primary'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 3: Session Title */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-inter-semibold text-slate-900 dark:text-slate-50">
            3. Session Name
          </Text>
          <TextInput
            placeholder="e.g. Chapter 4 Quiz Prep"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            className="rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-sm font-inter-regular text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
          />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={selectedMaterialIds.length === 0 || createSessionMutation.isPending}
          onPress={handleCreateSession}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 shadow-sm ${selectedMaterialIds.length === 0 || createSessionMutation.isPending
            ? 'bg-slate-300 dark:bg-slate-700'
            : 'bg-primary'
            }`}
        >
          {createSessionMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <BookOpen size={20} color="#FFFFFF" />
              <Text className="text-base font-inter-bold text-white">
                Enter Study Room ({selectedMaterialIds.length})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}
