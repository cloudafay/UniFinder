// Student Badge Component
// Öğrenci rozeti komponenti

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface StudentBadgeProps {
  badgeType?: 'verified_student' | 'international_student' | string | null;
  universityName?: string | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StudentBadge: React.FC<StudentBadgeProps> = ({
  badgeType,
  universityName,
  size = 'medium',
  showLabel = true,
}) => {
  if (!badgeType) return null;

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'px-1.5 py-0.5',
      icon: 12,
      text: 'text-[10px]',
    },
    medium: {
      container: 'px-2 py-1',
      icon: 14,
      text: 'text-xs',
    },
    large: {
      container: 'px-3 py-1.5',
      icon: 18,
      text: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  // Badge configurations
  const badgeConfig = {
    verified_student: {
      icon: 'school',
      color: '#22c55e',
      bgColor: 'bg-green-500/15',
      label: 'Doğrulanmış Öğrenci',
      shortLabel: '🎓',
    },
    international_student: {
      icon: 'earth',
      color: '#3b82f6',
      bgColor: 'bg-blue-500/15',
      label: 'Uluslararası Öğrenci',
      shortLabel: '🌍',
    },
  };

  const badge = badgeConfig[badgeType as keyof typeof badgeConfig];
  
  if (!badge) return null;

  return (
    <View className={`flex-row items-center rounded-full ${badge.bgColor} ${config.container}`}>
      <Ionicons name={badge.icon as any} size={config.icon} color={badge.color} />
      {showLabel && (
        <Text 
          className={`ml-1 font-semibold ${config.text}`}
          style={{ color: badge.color }}
        >
          {size === 'small' ? badge.shortLabel : badge.label}
        </Text>
      )}
    </View>
  );
};

// Compact inline badge for profile cards
export const StudentBadgeInline: React.FC<{ badgeType?: string | null }> = ({ badgeType }) => {
  if (!badgeType) return null;

  const isVerified = badgeType === 'verified_student';
  const isInternational = badgeType === 'international_student';

  if (!isVerified && !isInternational) return null;

  return (
    <View 
      className={`ml-1 px-1.5 py-0.5 rounded-full ${isVerified ? 'bg-green-500/20' : 'bg-blue-500/20'}`}
    >
      <Text className="text-xs">
        {isVerified ? '🎓' : '🌍'}
      </Text>
    </View>
  );
};

// Full badge with university name
export const StudentBadgeFull: React.FC<{
  badgeType?: string | null;
  universityName?: string | null;
}> = ({ badgeType, universityName }) => {
  if (!badgeType) return null;

  const isVerified = badgeType === 'verified_student';

  return (
    <View className="flex-row items-center">
      <StudentBadge badgeType={badgeType} size="medium" showLabel />
      {universityName && (
        <Text className="ml-2 text-xs text-slate-500">
          {universityName}
        </Text>
      )}
    </View>
  );
};

export default StudentBadge;
