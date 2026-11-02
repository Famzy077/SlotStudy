<div align="center">
  <h1>🎓 SlotStudy — Mobile Client</h1>
  <p><strong>AI-Powered Academic Study Companion for University & Distance-Learning Students</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 57" />
    <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native 0.86" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/NativeWind-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="NativeWind" />
  </p>
</div>

---

## 📖 Overview

**SlotStudy** is a cross-platform mobile application (Android, iOS, and Web) built with **React Native (Expo)** that transforms raw lecture handouts, PDFs, and slide images into interactive study summaries, practice quizzes, and grounded AI tutoring sessions.

Designed specifically with university and distance-learning students in mind, SlotStudy features an **Adaptive Nigerian Study Buddy ("The Sabi Senior Coursemate")** persona that can seamlessly code-switch between articulate academic English and relatable **Nigerian Pidgin**, using everyday analogies while remaining **100% strictly grounded** in the student's uploaded course materials.

---

## ✨ Key Features

### 🧠 1. Grounded AI Study Room (RAG Chat)
- **Strictly Grounded Answers**: Every AI explanation is restricted exclusively to the student's selected course handouts—eliminating outside hallucinations.
- **Interactive Source Citations**: Answers include inline citation badges (`[Source 1]`, `[Source 2, Page 4]`) that open a verification modal showing the exact excerpt from the uploaded document.
- **Adaptive Nigerian Pidgin & Study Buddy Persona**: Mirrors the student's engagement style—responding in sharp academic English, casual Nigerian-flavored English, or lively Nigerian Pidgin with relatable analogies and encouraging banter.
- **1-Tap Quick Action Chips**: Instant prompts inside the chat (`🇳🇬 Explain in Pidgin`, `💡 Naija Analogy`, `🎯 Quiz Me`, `📝 Key Takeaways`) for effortless learning without typing.
- **Real-Time SSE Streaming**: Token-by-token response streaming with stop/cancel controls.

### 🎙️ 2. Voice Interaction & Live AI Stream
- **Clear Male Voice Readout (Listen Feature)**: Built-in Text-to-Speech (`expo-speech`) tuned to select a crisp, natural male voice and strip markdown/emojis for effortless listening without reading the screen.
- **Voice Dictation**: Speak questions directly into the Study Room input bar.
- **Live AI Stream Mode**: Full-screen interactive voice session (`LiveStudyStreamModal`) with an animated pulsing AI audio orb that reacts to *Listening*, *Thinking*, and *Speaking* states (gated behind a configurable `LIVE_STREAM_COMING_SOON` flag in [`StudyRoomScreen.tsx`](./src/features/study-room/screens/StudyRoomScreen.tsx)).

### 📄 3. Smart Material Upload & AI Summaries
- **Multi-Format Upload**: Upload lecture PDFs, JPGs, and PNG images directly from the device and assign them to specific courses.
- **Structured Study Summaries**: Automatically generates a comprehensive summary containing:
  - Difficulty badge (`Beginner`, `Intermediate`, `Advanced`)
  - Estimated reading time
  - Markdown-formatted breakdown & bulleted **Key Points**
  - Direct **Ask AI Buddy** and **Take a Quiz** action buttons

### 📝 4. Adaptive Practice Quizzes & Mistake Breakdowns
- **On-Demand Quiz Generation**: Generate multiple-choice quizzes directly from any processed material summary.
- **Timed Practice & Instant Scoring**: Track accuracy, time spent, and question-by-question results.
- **Witty Wrong-Answer Explanations**: Missed a question? SlotStudy AI breaks down why your selected option was wrong and why the correct answer wins using memorable analogies.

### 🔥 5. Gamification, Streaks & Progress Analytics
- **Daily Study Streaks & XP Levels**: Earn XP for reading summaries, completing quizzes, and maintaining daily study consistency.
- **Exam Readiness & Subject Analytics**: Track overall quiz averages and identify which course subjects need the most focus.
- **Dark & Light Mode**: Full theme support across all screens via NativeWind.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Expo SDK 57](https://expo.dev/) / [React Native 0.86](https://reactnative.dev/) (New Architecture Enabled) |
| **Language** | [TypeScript 6.0](https://www.typescriptlang.org/) |
| **Styling** | [NativeWind v4](https://www.nativewind.dev/) (`Tailwind CSS` for React Native) |
| **Navigation** | [React Navigation v7](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **Server State & Caching** | [TanStack React Query v5](https://tanstack.com/query/latest) |
| **Client State** | [Zustand v5](https://zustand-demo.pmnd.rs/) + `AsyncStorage` / `Expo SecureStore` |
| **Networking** | [Axios](https://axios-http.com/) (REST) + Fetch ReadableStream / XHR (`text/event-stream` SSE) |
| **Animations & Icons** | `react-native-reanimated` v4 & `lucide-react-native` |
| **Speech & Media** | `expo-speech`, `expo-document-picker`, `expo-image-picker` |

---

## 📂 Project Architecture

The codebase follows a clean **Feature-Sliced Architecture** inside `src/`:

```text
SlotStudy-Client/
├── App.tsx                        # Root application entry, providers (React Query, SafeArea, AlertHost)
├── app.json                       # Expo configuration, bundle IDs, and native plugins
├── eas.json                       # Expo Application Services (EAS) build profiles (dev, preview APK, prod)
├── tailwind.config.js             # NativeWind / Tailwind theme & font definitions
└── src/
    ├── features/                  # Domain-driven feature modules
    │   ├── ai/                    # AI Hub, Material Upload, and AI Summary screens/hooks
    │   ├── auth/                  # Onboarding, Login, Signup, OTP verification, Academic Setup
    │   ├── courses/               # Course Library, Course Creation, and Course Details
    │   ├── home/                  # Dashboard, Greeting Header, Quick Actions, Continue Studying
    │   ├── notifications/         # In-app Notification feed
    │   ├── profile/               # User Profile, Academic Details, Help & Support
    │   ├── progress/              # XP, Streaks, and Subject Performance Analytics
    │   ├── quiz/                  # Quiz Hub, Active Quiz Runner, Quiz Results & AI Explanations
    │   ├── settings/              # Theme (Light/Dark/System) & Account Preferences
    │   ├── study-room/            # Grounded AI Study Room (RAG Chat & Live Voice Stream)
    │   │   ├── components/        # ChatMessageBubble, SourceCitationModal, LiveStudyStreamModal
    │   │   ├── hooks/             # useStudyRoom, useVoiceInteraction (Male TTS & Dictation)
    │   │   ├── screens/           # StudyRoomSetupScreen, StudyRoomScreen, StudyRoomHistoryScreen
    │   │   ├── services/          # study-room.api.ts (REST + SSE stream handler)
    │   │   └── types/             # StudySession, StudyMessage, SourceCitation types
    │   └── subscription/          # Plan management & billing screens
    ├── navigation/                # RootNavigator, AuthNavigator, MainNavigator, TabNavigator
    └── shared/                    # Reusable UI primitives & core utilities
        ├── components/            # Button, Input, Badge, MarkdownRenderer, AppAlert, Cards
        ├── constants/             # API endpoints, color tokens, spacing, typography
        ├── hooks/                 # useTheme, useDebounce
        ├── services/              # Axios API client with JWT refresh interceptors & secure storage
        ├── store/                 # Global app theme & UI store
        └── utils/                 # Date/file-size formatters and input validators
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `>= 20.x`
- **npm** or **yarn**
- **Expo Go** or an **Android Emulator / iOS Simulator**
- **SlotStudy Backend API** running locally or deployed (default fallback: `https://slotstudy.onrender.com/api/v1`)

### 1. Clone & Install Dependencies

```bash
git clone git@github.com:Famzy077/SlotStudy.git
cd SlotStudy-Client
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root of `SlotStudy-Client`:

```env
# Backend API Base URL
EXPO_PUBLIC_API_URL=https://example.com/api/v1

# Optional: Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# Optional: Support Contact Email
EXPO_PUBLIC_SUPPORT_EMAIL=support@slotstudy.app
```

### 3. Run the App Locally

```bash
# Start the Metro bundler
npm run start

# Run on Android device/emulator
npm run android

# Run on iOS simulator (macOS)
npm run ios

# Run in Web browser
npm run web
```

### 4. Type-Checking

Verify TypeScript types across the entire project:

```bash
npm run typecheck
```

---

## 📦 Building Android APK / Production Bundles (EAS)

This project is pre-configured with **Expo Application Services (EAS)** in [`eas.json`](./eas.json).

### Build a Shareable Android APK (`preview` profile)
To generate a standalone `.apk` file that can be installed directly on any Android phone:

```bash
npx eas-cli build -p android --profile preview
```

### Build for Google Play / App Store (`production` profile)

```bash
npx eas-cli build --platform all --profile production
```

---

## 🔧 Feature Flags & Customization

- **Live AI Stream Gate (`LIVE_STREAM_COMING_SOON`)**:
  Located in [`src/features/study-room/screens/StudyRoomScreen.tsx`](./src/features/study-room/screens/StudyRoomScreen.tsx):
  - Set `LIVE_STREAM_COMING_SOON = true` to display a `Live • Soon` badge and show a *"Live Stream Coming Soon 🎙️"* alert modal when tapped.
  - Set `LIVE_STREAM_COMING_SOON = false` to unlock the full-screen interactive [`LiveStudyStreamModal`](./src/features/study-room/components/LiveStudyStreamModal.tsx).

---

## 📄 License

This project is proprietary and maintained by the **SlotStudy Team**.
