import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { useAuthStore } from "../store/auth.store";
import {
  apiClient,
  getApiErrorMessage,
} from "@/shared/services/api.client";
import { Check, Eye, EyeOff } from "lucide-react-native";
import type { AuthResponse } from "../types/auth.types";

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.username || !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!termsAccepted) {
      Alert.alert(
        "Terms required",
        "Please read and accept the Terms and Conditions to create an account.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<
        AuthResponse | { otpRequired: true; email: string }
      >(
        "/auth/register",
        {
          ...form,
          email: form.email.trim().toLowerCase(),
          username: form.username.trim().toLowerCase(),
          termsAccepted: true,
        },
      );
      if ("otpRequired" in response.data && response.data.otpRequired) {
        navigation.navigate("VerifyOtp", { email: response.data.email });
      } else if ("accessToken" in response.data && response.data.accessToken) {
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        Alert.alert(
          "Account ready",
          "Your verified account is ready. Welcome to SlotStudy!",
          [{ text: "Go to dashboard" }],
        );
      }
    } catch (error) {
      Alert.alert(
        "Signup failed",
        getApiErrorMessage(error, "Something went wrong. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      className="flex-1 bg-surface dark:bg-slate-900 justify-center px-8"
      padded={false}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Create Account
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-lg">
            Join SlotStudy to start your journey.
          </Text>
        </View>

        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              Full Name
            </Text>
            <TextInput
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              placeholder="John Doe"
              placeholderTextColor="#94a3b8"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              Username
            </Text>
            <TextInput
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              placeholder="johndoe123"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              value={form.username}
              onChangeText={(text) =>
                setForm({ ...form, username: text.toLowerCase() })
              }
            />
          </View>

          <View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              Email Address
            </Text>
            <TextInput
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          </View>

          <View>
            <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              Password
            </Text>
            <View className="relative justify-center">
              <TextInput
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-slate-900 dark:text-white"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityState={{ selected: showPassword }}
                className="absolute right-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#94a3b8" />
                ) : (
                  <Eye size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mb-6 flex-row items-start">
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            accessibilityLabel="I agree to the Terms and Conditions"
            onPress={() => setTermsAccepted((accepted) => !accepted)}
            className={`mr-2 mt-0.5 h-5 w-5 items-center justify-center rounded border ${
              termsAccepted
                ? "border-indigo-600 bg-indigo-600"
                : "border-slate-400 dark:border-slate-500"
            }`}
          >
            {termsAccepted ? <Check size={14} color="#ffffff" /> : null}
          </TouchableOpacity>
          <Text className="flex-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            I have read and agree to the{" "}
            <Text
              accessibilityRole="link"
              onPress={() => navigation.navigate("Terms")}
              className="font-semibold text-primary"
            >
              Terms and Conditions
            </Text>
            .
          </Text>
        </View>

        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          className="w-full mb-6"
        />

        <View className="flex-row justify-center">
          <Text className="text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-primary font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SignupScreen;
