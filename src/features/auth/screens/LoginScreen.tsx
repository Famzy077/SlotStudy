import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { useGoogleLogin } from "../hooks/useAuth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/auth.store";
import {
  apiClient,
  getApiErrorMessage,
} from "@/shared/services/api.client";
import { Button } from "@/shared/components/ui/Button";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { Check, Eye, EyeOff } from "lucide-react-native";
import type { AuthResponse } from "../types/auth.types";

// Required for web browser to close correctly after auth
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: loginWithGoogle, isPending: isGooglePending } =
    useGoogleLogin();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const termsAcceptedRef = useRef(false);
  const passwordInputRef = useRef<any>(null);

  // Load client IDs from .env with fallbacks to prevent crash if undefined
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "missing-android-id",
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "missing-ios-id",
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "missing-web-id",
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      loginWithGoogle(
        {
          idToken: response.authentication.idToken,
          termsAccepted: termsAcceptedRef.current,
        },
        {
          onSuccess: () =>
            Alert.alert(
              "Login successful",
              "Welcome back! Your student dashboard is ready.",
              [{ text: "Go to dashboard" }],
            ),
          onError: (error) =>
            Alert.alert(
              "Login failed",
              getApiErrorMessage(error, "We couldn't sign you in. Please try again."),
            ),
        },
      );
    }
  }, [response]);

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleLocalLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const auth = response.data;
      if (!auth?.accessToken) {
        throw new Error("We couldn't sign you in. Please try again.");
      }
      setAuth(auth.user, auth.accessToken, auth.refreshToken);
      Alert.alert(
        "Login successful",
        `Welcome back, ${auth.user.name}. Your student dashboard is ready.`,
        [{ text: "Go to dashboard" }],
      );
    } catch (error) {
      Alert.alert(
        "Login failed",
        getApiErrorMessage(error, "We couldn't sign you in. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface dark:bg-slate-900">
      <LinearGradient
        colors={["rgba(37,99,235,0.1)", "rgba(37,99,235,0)", "transparent"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 400 }}
      />

      <ScreenWrapper className="flex-1 justify-center px-8" padded={false}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-10 pt-10">
            <Image
              source={require("../../../../assets/images/logo.png")}
              style={{ width: 220, height: 160, resizeMode: "contain" }}
              className="mb-4"
            />
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              Welcome back
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center text-base px-4">
              Sign in to continue your learning journey
            </Text>
          </View>

          <View className="space-y-4 mb-6">
            <View className="mb-4">
              <TextInput
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white"
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.email}
                autoComplete="username"
                textContentType="username"
                importantForAutofill="yes"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                onChangeText={(text) =>
                  setForm((current) => ({ ...current, email: text }))
                }
              />
            </View>

            <View className="relative justify-center">
              <TextInput
                ref={passwordInputRef}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-slate-900 dark:text-white"
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                value={form.password}
                autoComplete="current-password"
                textContentType="password"
                importantForAutofill="yes"
                returnKeyType="done"
                onSubmitEditing={handleLocalLogin}
                onChangeText={(text) =>
                  setForm((current) => ({ ...current, password: text }))
                }
              />
              <TouchableOpacity
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

          <Button
            title="Log In"
            onPress={handleLocalLogin}
            loading={loading}
            className="w-full mb-6"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            className="mb-6 self-end"
          >
            <Text className="font-semibold text-primary">Forgot password?</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mb-6">
            <View className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
            <Text className="px-4 text-slate-400 font-medium">OR</Text>
            <View className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
          </View>

          <View className="mb-6 flex-row items-start">
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              accessibilityLabel="I agree to the Terms and Conditions for new Google accounts"
              onPress={() =>
                setTermsAccepted((accepted) => {
                  termsAcceptedRef.current = !accepted;
                  return !accepted;
                })
              }
              className={`mr-2 mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                termsAccepted
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-slate-400 dark:border-slate-500"
              }`}
            >
              {termsAccepted ? <Check size={14} color="#ffffff" /> : null}
            </TouchableOpacity>
            <Text className="flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              If this is your first Google sign-in, agree to the{" "}
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

          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={!request || isGooglePending}
            activeOpacity={0.8}
            className="flex-row items-center justify-center bg-white dark:bg-slate-800 py-3.5 px-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8"
          >
            <Image
              source={require("../../../../assets/images/google.png")}
              style={{ width: 22, height: 22, marginRight: 12 }}
            />
            <Text className="text-slate-900 dark:text-white font-semibold text-base">
              {isGooglePending ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-auto pb-10">
            <Text className="text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenWrapper>
    </View>
  );
};

export default LoginScreen;
