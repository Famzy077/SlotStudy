import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";

const sections = [
  {
    title: "1. About these Terms",
    paragraphs: [
      "These Terms and Conditions (Terms) govern your access to and use of SlotStudy, including our website, mobile application, study tools, and student community features. By creating an account or using SlotStudy, you agree to these Terms. If you do not agree, do not create an account or use the service.",
      "SlotStudy provides digital study tools and features that can help students connect. It is not a university, a safety service, or a party to personal arrangements made between users.",
    ],
  },
  {
    title: "2. Accounts and eligibility",
    paragraphs: [
      "You must provide accurate account information, keep your login credentials secure, and promptly update information that changes. You are responsible for activity under your account.",
      "Use SlotStudy only if you are legally able to agree to these Terms. If you are under the age of legal majority where you live, use the service only with any consent required by local law and a parent or guardian.",
    ],
  },
  {
    title: "3. Acceptable use",
    paragraphs: [
      "Use SlotStudy lawfully and respectfully. Do not impersonate others, harass or threaten anyone, share unlawful or harmful content, misuse another person’s information, interfere with the service, or use the platform to facilitate fraud or other illegal activity.",
      "You are responsible for the content you submit and for respecting the rights and boundaries of other users. We may review reports and take reasonable action, including removing content, restricting features, or suspending accounts.",
    ],
  },
  {
    title: "4. Study Buddy and other user interactions",
    paragraphs: [
      "Study Buddy helps students discover one another and communicate. User profiles and messages are provided by users and may be incomplete or inaccurate. SlotStudy does not conduct background checks, verify every profile, or guarantee a user’s identity, conduct, qualifications, or intentions.",
      "Use care when communicating or sharing personal information. You decide whether to connect, continue a conversation, or share contact details. You can block or report users through the available features.",
    ],
  },
  {
    title: "5. In-person meetings and personal safety",
    paragraphs: [
      "If you choose to meet another SlotStudy user in person, you do so voluntarily and at your own discretion. SlotStudy does not arrange, attend, supervise, or control private meetings between users and cannot guarantee anyone’s safety or behavior.",
      "Each person is responsible for their own decisions, conduct, and personal safety before, during, and after an in-person meeting. Consider meeting in a public place, telling someone you trust where you will be, arranging your own transport, and leaving if you feel uncomfortable. Do not rely on SlotStudy to assess another user or to provide emergency assistance.",
      "To the extent permitted by applicable law, SlotStudy is not responsible for users’ independent actions or for loss or harm arising from voluntary user-to-user meetings. This does not exclude or limit any responsibility that cannot legally be excluded or limited, including responsibility for SlotStudy’s own acts or omissions where the law requires it.",
    ],
  },
  {
    title: "6. Educational tools and user content",
    paragraphs: [
      "Summaries, generated answers, quizzes, recommendations, and other learning outputs are provided for study support and may contain errors or omissions. Check important information against your course materials and authoritative sources. SlotStudy does not guarantee grades, academic outcomes, or the accuracy or availability of generated content.",
      "You retain rights to content you own. You grant SlotStudy permission to host, process, and display content as needed to provide and improve the features you use, subject to our privacy practices and applicable law. Do not upload material you do not have permission to use.",
    ],
  },
  {
    title: "7. Availability and changes",
    paragraphs: [
      "We aim to keep SlotStudy available, but features may change, be interrupted, or be discontinued. We may update these Terms when our service or legal requirements change. We will post the revised Terms and update the effective date; where required, we will seek renewed consent.",
    ],
  },
  {
    title: "8. Suspension and termination",
    paragraphs: [
      "You may stop using SlotStudy at any time. We may restrict or suspend access when reasonably needed to protect users, the service, or comply with law, including when these Terms are violated. We will handle account data according to our applicable privacy practices and legal obligations.",
    ],
  },
  {
    title: "9. Disclaimers and liability",
    paragraphs: [
      "To the extent permitted by law, SlotStudy is provided “as is” and “as available,” without guarantees that the service will be uninterrupted, error-free, or suitable for every purpose. Nothing in these Terms removes consumer or other rights that cannot be waived under applicable law.",
      "Nothing in these Terms excludes or limits liability where applicable law does not allow that exclusion or limitation. Subject to that rule, SlotStudy is not liable for indirect or consequential loss arising from your use of the service or independent interactions with other users.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      "For questions or concerns about these Terms, contact SlotStudy through the Help & Support feature in the app or website.",
    ],
  },
];

const TermsScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper className="flex-1 px-5" padded={false}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xs font-inter-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          SLOTSTUDY POLICIES
        </Text>
        <Text className="mt-2 text-3xl font-inter-bold text-slate-900 dark:text-white">
          Terms and Conditions
        </Text>
        <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Effective date: November 6, 2026
        </Text>

        <View className="mt-6">
          {sections.map((section) => (
            <View key={section.title} className="mb-6">
              <Text className="mb-2 text-base font-inter-bold text-slate-900 dark:text-slate-100">
                {section.title}
              </Text>
              {section.paragraphs.map((paragraph) => (
                <Text
                  key={paragraph}
                  className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          className="items-center rounded-xl bg-indigo-600 py-3"
        >
          <Text className="font-inter-bold text-white">Back to sign up</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default TermsScreen;
