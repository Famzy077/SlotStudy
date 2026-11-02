import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { useAuthStore } from "../store/auth.store";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Start with your course",
    description:
      "Choose your Nigerian distance-learning university and add the courses you are studying.",
    image: require("../../../../assets/images/onboarding/learn_faster_real.jpg"),
  },
  {
    id: "2",
    title: "Bring your study materials",
    description:
      "Upload a PDF or image of your notes. SlotStudy turns it into a clear, source-grounded summary.",
    image: require("../../../../assets/images/onboarding/study_smarter_real.jpg"),
  },
  {
    id: "3",
    title: "Learn, practise, improve",
    description:
      "Review your summary, try a practice quiz or test, then revisit mistakes and explanations.",
    image: require("../../../../assets/images/onboarding/track_progress_real.jpg"),
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<any>(null);
  const navigation = useNavigation<any>();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentIndex(Math.round(index));
  };

  const completeOnboarding = () => {
    setOnboarded(true);
    navigation.replace("Login");
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
        bounces={false}
        accessibilityLabel="SlotStudy introduction"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.id}
            style={{ width, height }}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`${slide.title}. ${slide.description}`}
          >
            <ImageBackground
              source={slide.image}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.1)",
                  "rgba(0,0,0,0.6)",
                  "rgba(0,0,0,0.95)",
                ]}
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  padding: 32,
                  paddingBottom: 120,
                }}
              >
                <Text className="text-4xl font-extrabold text-white mb-4 text-center">
                  {slide.title}
                </Text>
                <Text className="text-lg text-slate-300 text-center leading-relaxed">
                  {slide.description}
                </Text>
              </LinearGradient>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      {/* Floating Header (Skip button) */}
      <View className="absolute top-12 right-6 z-10">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Skip introduction and sign in"
          onPress={completeOnboarding}
          className="bg-black/30 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Bottom Controls */}
      <View className="absolute bottom-8 left-0 right-0 px-8 z-10">
        <View className="flex-row justify-center space-x-2 mb-4">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}${index === currentIndex ? ", current page" : ""}`}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </View>
        <Button
          title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={nextSlide}
          className="w-full mb-6 shadow-lg"
          accessibilityLabel={
            currentIndex === SLIDES.length - 1
              ? "Get started with SlotStudy"
              : `Go to introduction page ${currentIndex + 2}`
          }
        />
      </View>
    </View>
  );
};

export default OnboardingScreen;
