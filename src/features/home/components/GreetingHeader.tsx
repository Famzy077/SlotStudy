import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  greeting: string;
  name: string;
  avatarUrl?: string | null;
  username: string;
}

const GreetingHeader = ({ greeting, name, username, avatarUrl }: Props) => {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-row items-center justify-between mb-14 px-6 pt-4">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View ${name}'s profile`}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}
        className="flex-row items-center flex-1 mr-3"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full mr-4" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
            <Text className="text-white font-bold text-lg">{name.charAt(0)}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">{greeting}</Text>
          <Text numberOfLines={1} className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {name} 👋
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center shadow-sm"
      >
        <Bell size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
};

export default GreetingHeader;
