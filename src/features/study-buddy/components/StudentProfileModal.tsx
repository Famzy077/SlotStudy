import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookOpen, GraduationCap, School, X } from 'lucide-react-native';
import type { StudyBuddyStudent } from '../types/study-buddy.types';

interface StudentProfileModalProps {
  student: StudyBuddyStudent | null;
  isOnline: boolean;
  onClose: () => void;
}

function getStudyYearLabel(year: number): string {
  const suffix =
    year % 100 >= 11 && year % 100 <= 13
      ? 'th'
      : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[year % 10] ||
        'th';
  return `${year}${suffix} year`;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOnline,
  onClose,
}) => (
  <Modal
    visible={Boolean(student)}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View className="flex-1 items-center justify-center bg-black/50 px-5 py-8">
      <View className="max-h-full w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900">
        <View className="items-end px-4 pt-4">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close student profile"
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
        {student ? (
          <ScrollView
            className="px-5 pb-6"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="items-center">
              {student.avatarUrl ? (
                <Image
                  source={{ uri: student.avatarUrl }}
                  className="h-20 w-20 rounded-full"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Text className="text-2xl font-inter-bold text-indigo-700 dark:text-indigo-300">
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text className="mt-3 text-center font-inter-bold text-xl text-slate-900 dark:text-slate-50">
                {student.name}
              </Text>
              <Text
                className={`mt-1 text-xs font-inter-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
              >
                {isOnline ? 'Online now' : 'Student'}
              </Text>
            </View>

            <View className="mt-6 gap-3">
              {student.school ? (
                <View className="flex-row items-start rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <School size={17} color="#4f46e5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-[11px] font-inter-semibold uppercase tracking-wide text-slate-500">
                      School
                    </Text>
                    <Text className="mt-0.5 text-sm font-inter-medium text-slate-800 dark:text-slate-100">
                      {student.school}
                    </Text>
                  </View>
                </View>
              ) : null}
              {student.program ? (
                <View className="flex-row items-start rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <GraduationCap size={17} color="#4f46e5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-[11px] font-inter-semibold uppercase tracking-wide text-slate-500">
                      Program
                    </Text>
                    <Text className="mt-0.5 text-sm font-inter-medium text-slate-800 dark:text-slate-100">
                      {student.program}
                    </Text>
                  </View>
                </View>
              ) : null}
              {student.yearOfStudy != null ? (
                <View className="flex-row items-start rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <GraduationCap size={17} color="#4f46e5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-[11px] font-inter-semibold uppercase tracking-wide text-slate-500">
                      Year of study
                    </Text>
                    <Text className="mt-0.5 text-sm font-inter-medium text-slate-800 dark:text-slate-100">
                      {getStudyYearLabel(student.yearOfStudy)}
                    </Text>
                  </View>
                </View>
              ) : null}
              {student.bio ? (
                <View className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <Text className="text-[11px] font-inter-semibold uppercase tracking-wide text-slate-500">
                    About
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-slate-700 dark:text-slate-200">
                    {student.bio}
                  </Text>
                </View>
              ) : null}
              {student.courses.length > 0 ? (
                <View className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <Text className="text-[11px] font-inter-semibold uppercase tracking-wide text-slate-500">
                    Courses
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {student.courses.map((course) => (
                      <View
                        key={course}
                        className="flex-row items-center rounded-lg bg-white px-2.5 py-1 dark:bg-slate-900"
                      >
                        <BookOpen size={12} color="#4f46e5" />
                        <Text className="ml-1.5 text-xs font-inter-medium text-slate-700 dark:text-slate-200">
                          {course}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
  </Modal>
);
