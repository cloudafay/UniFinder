// Bottom Tab Bar Component
// Alt navigasyon çubuğu - Glassmorphism tasarım

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconFocused: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
};

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  tabs?: TabItem[];
}

const DEFAULT_TABS: TabItem[] = [
  { key: 'Discover', label: 'Keşfet', icon: 'style', iconFocused: 'style' },
  { key: 'Messages', label: 'Mesajlar', icon: 'chat-bubble-outline', iconFocused: 'chat-bubble' },
  { key: 'Profile', label: 'Profil', icon: 'person-outline', iconFocused: 'person' },
];

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_TABS,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 8,
          backgroundColor: isDark
            ? 'rgba(16, 19, 34, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconName = isActive ? tab.iconFocused : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            accessibilityLabel={`${tab.label} sekmesi${isActive ? ', seçili' : ''}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={iconName}
                size={26}
                color={isActive ? Colors.primary : colors.textTertiary}
              />
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? Colors.primary : colors.textTertiary,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
      default: {},
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default BottomTabBar;
