import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Crown,
  Flame,
  GraduationCap,
  LogOut,
  Settings,
  Sparkles,
  Trophy,
  Pencil,
} from "lucide-react-native";
import { useProfile } from "../hooks/useProfile";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { LoadingSkeleton } from "@/shared/components/ui/LoadingSkeleton";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import EditProfileModal from "../components/EditProfileModal";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [isEditProfileVisible, setIsEditProfileVisible] = React.useState(false);
  const { data: profileResponse, isLoading, isError, refetch } = useProfile();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    Alert.alert("Log out?", "You can sign back in at any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () =>
          logoutMutation.mutate(undefined, {
            onError: () =>
              Alert.alert(
                "Signed out",
                "This device was signed out, but the server could not end the refresh session.",
              ),
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <LoadingSkeleton className="h-56 m-4 rounded-3xl" />
        <LoadingSkeleton className="h-28 m-4 rounded-3xl" />
        <LoadingSkeleton className="h-64 m-4 rounded-3xl" />
      </ScreenWrapper>
    );
  }

  if (isError || !profileResponse?.data) {
    return (
      <ScreenWrapper>
        <ErrorState
          message="We couldn’t load your profile."
          onRetry={refetch}
        />
      </ScreenWrapper>
    );
  }

  const profile = profileResponse.data;
  const initials =
    profile.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  const menuItems = [
    {
      label: "Notifications",
      detail: "Your reminders and updates",
      icon: Bell,
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      label: "Subscription",
      detail: "Manage your study plan",
      icon: Crown,
      onPress: () => navigation.navigate("Subscription"),
    },
    {
      label: "Settings",
      detail: "Personalize your app",
      icon: Settings,
      onPress: () => navigation.navigate("Settings"),
    },
    {
      label: "Help & support",
      detail: "FAQs and ways to reach us",
      icon: CircleHelp,
      onPress: () => navigation.navigate("HelpSupport"),
    },
  ];

  return (
    <ScreenWrapper scroll>
      <View className="pb-8">
        <View className="flex-row items-center justify-between pt-3 pb-5">
          <View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Profile
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate("Settings")}
            className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-800"
          >
            <Settings size={21} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View className="rounded-3xl bg-primary p-5">
          <View className="flex-row items-center">
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                className="h-20 w-20 rounded-full border-2 border-white/70"
              />
            ) : (
              <View className="h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <Text className="text-2xl font-bold text-white">
                  {initials}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-white">
                {profile.name || "Student"}
              </Text>
              {profile.username ? (
                <Text className="mt-0.5 text-sm text-white/80">
                  @{profile.username}
                </Text>
              ) : null}
              <Text className="mt-1 text-sm text-white/80">
                {profile.email}
              </Text>
              <View className="mt-2 self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="text-xs font-bold uppercase text-white">
                  {profile.subscription?.plan || "free"} plan
                </Text>
              </View>
            </View>
          </View>
          <View className="mt-5 flex-row items-center border-t border-white/20 pt-4">
            <GraduationCap size={18} color="#FFFFFF" />
            <Text className="ml-2 flex-1 text-sm text-white/90">
              {profile.university || "Add your university in profile settings"}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setIsEditProfileVisible(true)}
            className="mt-4 flex-row items-center justify-center rounded-2xl bg-white/15 px-4 py-3"
          >
            <Pencil size={16} color="#FFFFFF" />
            <Text className="ml-2 font-semibold text-white">Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-5 flex-row gap-3">
          <StatCard
            icon={BookOpen}
            value={profile.stats.totalCourses}
            label="Courses"
          />
          <StatCard
            icon={Trophy}
            value={profile.stats.totalQuizzes}
            label="Quizzes"
          />
          <StatCard
            icon={Flame}
            value={profile.stats.currentStreak}
            label="Day streak"
          />
        </View>

        <View className="mt-5 flex-row items-center rounded-3xl bg-white p-4 dark:bg-slate-800">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
            <Sparkles size={22} color="#D97706" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-slate-900 dark:text-slate-50">
              Level {profile.stats.level}
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {profile.stats.totalXp.toLocaleString()} XP earned ·{" "}
              {typeof profile.stats.studyHours === "string"
                ? `${profile.stats.studyHours} study time`
                : `${profile.stats.studyHours} study hours`}
            </Text>
          </View>
        </View>

        <Text className="mb-2 mt-7 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Account
        </Text>
        <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-800">
          {menuItems.map(({ label, detail, icon: Icon, onPress }, index) => (
            <TouchableOpacity
              key={label}
              accessibilityRole="button"
              onPress={onPress}
              className={`flex-row items-center px-4 py-4 ${
                index < menuItems.length - 1
                  ? "border-b border-slate-100 dark:border-slate-700"
                  : ""
              }`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                <Icon size={20} color="#475569" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-slate-900 dark:text-slate-50">
                  {label}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {detail}
                </Text>
              </View>
              <ChevronRight size={19} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
          className="mt-5 flex-row items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-4 dark:border-red-900 dark:bg-slate-800"
        >
          {logoutMutation.isPending ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <LogOut size={19} color="#DC2626" />
          )}
          <Text className="ml-2 font-semibold text-red-600">
            {logoutMutation.isPending ? "Signing out..." : "Log out"}
          </Text>
        </TouchableOpacity>
      </View>
      <EditProfileModal
        visible={isEditProfileVisible}
        profile={profile}
        onClose={() => setIsEditProfileVisible(false)}
      />
    </ScreenWrapper>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-white px-2 py-4 dark:bg-slate-800">
      <Icon size={19} color="#2563EB" />
      <Text className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-50">
        {value}
      </Text>
      <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {label}
      </Text>
    </View>
  );
}
