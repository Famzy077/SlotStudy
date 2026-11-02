import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { BottomTabBar } from '@/shared/components/navigation/BottomTabBar';

import HomeScreen from '@/features/home/screens/HomeScreen';
import CourseLibraryScreen from '@/features/courses/screens/CourseLibraryScreen';
import AIHubScreen from '@/features/ai/screens/AIHubScreen';
import StudyBuddyScreen from '@/features/study-room/screens/StudyBuddyScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Courses" component={CourseLibraryScreen} />
      <Tab.Screen name="AI" component={AIHubScreen} />
      <Tab.Screen
        name="StudyBuddy"
        component={StudyBuddyScreen}
        options={{ tabBarLabel: 'Study Buddy' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
