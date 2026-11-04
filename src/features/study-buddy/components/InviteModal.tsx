import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import { X, Copy, Check, Share2, Users, Gift } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { studyBuddyService } from '../services/study-buddy.service';
import type { ReferralInfo } from '../types/study-buddy.types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<Props> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<ReferralInfo | null>(null);

  useEffect(() => {
    if (visible) {
      loadReferral();
    }
  }, [visible]);

  const loadReferral = async () => {
    try {
      setLoading(true);
      const data = await studyBuddyService.getReferralInfo();
      setInfo(data);
    } catch (err) {
      console.warn('Failed to load referral info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!info?.referralLink) return;
    await Clipboard.setStringAsync(info.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!info?.referralLink) return;
    try {
      await Share.share({
        message: `Hey! Study with me on SlotStudy — the smart AI coursemate that turns lecture slides into instant briefs and revision quizzes. Use my link to connect as study buddies automatically: ${info.referralLink}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Text className="font-inter-bold text-lg text-slate-900 dark:text-slate-50">
              Invite a Coursemate
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
              <View className="items-center py-2">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-900/30">
                  <Gift size={32} color="#4F46E5" />
                </View>
                <Text className="mt-3 text-center font-inter-bold text-base text-slate-900 dark:text-slate-50">
                  Study Better Together 🤝
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-500 leading-5 px-4">
                  Share your link with friends. When they sign up, you will both be instantly connected as study buddies!
                </Text>
              </View>

              {/* Referral Code Badge */}
              <View className="mt-4 items-center">
                <Text className="text-[11px] font-inter-semibold uppercase tracking-wider text-slate-400">
                  Your Referral Code
                </Text>
                <View className="mt-1.5 rounded-2xl bg-slate-100 px-5 py-2.5 dark:bg-slate-800">
                  <Text className="text-xl font-inter-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                    {info?.referralCode || 'SLOT-BUDDY'}
                  </Text>
                </View>
              </View>

              {/* Referral Link Box */}
              <View className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <Text numberOfLines={1} className="text-xs font-inter-mono text-slate-600 dark:text-slate-300">
                  {info?.referralLink}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="mt-5 flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCopy}
                  activeOpacity={0.8}
                  className="flex-1 flex-row items-center justify-center rounded-2xl bg-indigo-600 py-3.5 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check size={18} color="#FFFFFF" />
                      <Text className="ml-2 font-inter-bold text-white text-sm">Copied!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={18} color="#FFFFFF" />
                      <Text className="ml-2 font-inter-bold text-white text-sm">Copy Link</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShare}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <Share2 size={18} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View className="mt-5 flex-row items-center justify-center">
                <Users size={14} color="#64748b" />
                <Text className="ml-1.5 text-xs text-slate-500">
                  {info?.totalReferrals || 0} coursemates joined via your link
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
