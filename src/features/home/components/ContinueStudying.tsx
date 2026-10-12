import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { CourseCard } from '@/shared/components/cards/CourseCard'; // Assuming exists
import { useNavigation } from '@react-navigation/native';
import { DashboardData } from '../types/home.types';

interface Props {
  courses: DashboardData["recentCourses"];
}

const ContinueStudying = ({ courses }: Props) => {
  const navigation = useNavigation<any>();

  if (!courses || courses.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="flex-row items-center justify-between px-6 mb-4">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Continue Studying
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
          <Text className="text-primary font-medium">See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
      >
        {courses.map((course) => (
          <View key={course.id} className="w-64">
            <CourseCard id={course.id} title={course.title} subject={course.subject} progress={course.progress} totalTopics={course.totalTopics} completedTopics={course.completedTopics} lastAccessed={course.lastAccessed} onPress={() => { }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ContinueStudying;
