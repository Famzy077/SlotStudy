import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Check, Eye, BookOpen, GraduationCap } from 'lucide-react-native';
import { studyBuddyService } from '../services/study-buddy.service';
import type { StudyBuddySettings } from '../types/study-buddy.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const StudyBuddySettingsModal: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDiscoveryVisible, setIsDiscoveryVisible] = useState(true);
  const [bio, setBio] = useState('');
  const [coursesInput, setCoursesInput] = useState('');
  const [school, setSchool] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await studyBuddyService.getSettings();
      setIsDiscoveryVisible(data.visible);
      setBio(data.bio || '');
      setCoursesInput((data.courses || []).join(', '));
      setSchool(data.school);
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const coursesArray = coursesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await studyBuddyService.updateSettings({
        visible: isDiscoveryVisible,
        bio: bio.trim(),
        courses: coursesArray,
      });

      onSaved?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900 max-h-[85%]">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Text className="font-inter-bold text-lg text-slate-900 dark:text-slate-50">
              Study Buddy Settings
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : (
            <View className="py-4">
              {/* Visible Toggle */}
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center">
                    <Eye size={16} color="#4F46E5" />
                    <Text className="ml-2 font-inter-semibold text-sm text-slate-900 dark:text-slate-50">
                      Discovery Visibility
                    </Text>
                  </View>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    Allow coursemates from your school to discover and send you study buddy requests.
                  </Text>
                </View>
                <Switch
                  value={isDiscoveryVisible}
                  onValueChange={setIsDiscoveryVisible}
                  trackColor={{ false: '#cbd5e1', true: '#4F46E5' }}
                />
              </View>

              {/* Bio Field */}
              <View className="mt-4">
                <Text className="font-inter-semibold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                  Study Bio & Goals
                </Text>
                <TextInput
                  placeholder="e.g. 200L CompSci studying Data Structures. Aiming for First Class!"
                  placeholderTextColor="#94a3b8"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-inter-regular text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </View>

              {/* Courses Field */}
              <View className="mt-4">
                <Text className="font-inter-semibold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                  Courses Being Studied (comma-separated)
                </Text>
                <TextInput
                  placeholder="e.g. GST101, MTH201, CSC205"
                  placeholderTextColor="#94a3b8"
                  value={coursesInput}
                  onChangeText={setCoursesInput}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-inter-regular text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </View>

              {school ? (
                <View className="mt-3 flex-row items-center">
                  <GraduationCap size={13} color="#64748b" />
                  <Text className="ml-1.5 text-xs text-slate-400">
                    School: {school}
                  </Text>
                </View>
              ) : null}

              {/* Save Button */}
              <TouchableOpacity
                disabled={saving}
                onPress={handleSave}
                activeOpacity={0.8}
                className="mt-6 flex-row items-center justify-center rounded-2xl bg-indigo-600 py-3.5"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text className="ml-2 font-inter-bold text-white text-sm">Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
