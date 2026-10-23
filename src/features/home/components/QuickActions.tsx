import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppAlert } from "@/shared/components/feedback/AppAlert";
import {
  Upload,
  BrainCircuit,
  FileText,
  Layers,
  Sparkles,
  Copy,
} from "lucide-react-native";

const configMap: any = {
  upload: {
    icon: Upload,
    color: "#2563EB",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  quiz: {
    icon: BrainCircuit,
    color: "#F59E0B",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  summary: {
    icon: FileText,
    color: "#4F46E5",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
  },
  sparkles: {
    icon: Sparkles,
    color: "#4F46E5",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
  },
  cards: {
    icon: Copy,
    color: "#7C3AED",
    bg: "bg-purple-50 dark:bg-purple-900/30",
  },
};

interface Action {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface Props {
  actions: Action[];
}

const QuickActions = ({ actions }: Props) => {
  const navigation = useNavigation<any>();

  return (
    <View className="px-6 mb-8">
      <Text className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-50">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {actions.map((action) => {
          const config = configMap[action.icon] || {
            icon: Layers,
            color: "#2563EB",
            bg: "bg-blue-50 dark:bg-blue-900/30",
          };
          const Icon = config.icon;
          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.85}
              onPress={() => {
                if (action.route === "Flashcards") {
                  AppAlert.alert("Coming soon", "Flashcards are coming soon!");
                } else if (action.route === "Upload") {
                  navigation.navigate("UploadMaterial"); // fallback in case old backend is active
                } else if (action.route === "Quiz") {
                  navigation.navigate("QuizHub");
                } else if (action.route === "AISummary") {
                  navigation.navigate("AI");
                } else {
                  navigation.navigate(action.route);
                }
              }}
              className="w-[48%] bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 p-4 rounded-3xl shadow-sm items-center justify-center aspect-square"
            >
              <View className={`${config.bg} p-4 rounded-2xl mb-3`}>
                <Icon size={32} color={config.color} />
              </View>
              <Text className="text-slate-900 dark:text-slate-50 font-semibold text-center">
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default QuickActions;
