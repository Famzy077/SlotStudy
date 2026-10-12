import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, BookOpen, FileText } from 'lucide-react-native';
import { SourceCitation } from '../types/study-room.types';
import { useTheme } from '@/shared/hooks/useTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  sources: SourceCitation[];
}

export const SourceCitationModal: React.FC<Props> = ({
  visible,
  onClose,
  sources,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[80%] rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/40">
                <BookOpen size={20} color={colors.primary} />
              </View>
              <Text className="text-xl font-inter-bold text-slate-900 dark:text-slate-50">
                Verified Sources ({sources.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close sources modal"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="mb-4 text-xs font-inter-regular text-slate-500">
            This answer was generated exclusively from the following excerpts in your selected course materials.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {sources.map((source, index) => (
              <View
                key={`${source.materialId}-${source.chunkIndex}-${index}`}
                className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-2">
                    <FileText size={16} color={colors.primary} />
                    <Text
                      numberOfLines={1}
                      className="flex-1 text-sm font-inter-semibold text-slate-800 dark:text-slate-200"
                    >
                      {source.materialTitle}
                    </Text>
                  </View>
                  <View className="rounded-full bg-blue-100/80 px-2.5 py-0.5 dark:bg-blue-900/40">
                    <Text className="text-xs font-inter-medium text-blue-700 dark:text-blue-300">
                      {source.pageNumber
                        ? `Page ${source.pageNumber}`
                        : `Section ${source.chunkIndex + 1}`}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-inter-regular leading-relaxed text-slate-600 dark:text-slate-400">
                  "{source.excerpt}"
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
