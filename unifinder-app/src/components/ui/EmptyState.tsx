// Boş Durum Bileşeni
// Boş liste durumları için özel gösterimler

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

type EmptyStateType = 
  | 'no-matches'
  | 'no-messages'
  | 'no-notifications'
  | 'no-results'
  | 'no-photos'
  | 'error'
  | 'offline'
  | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: keyof typeof MaterialIcons.glyphMap;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

// Varsayılan içerikler
const defaultContent: Record<EmptyStateType, { icon: string; title: string; description: string }> = {
  'no-matches': {
    icon: 'favorite-border',
    title: 'Henüz Eşleşme Yok',
    description: 'Keşfet ekranında swipe yaparak yeni kişilerle eşleş!',
  },
  'no-messages': {
    icon: 'chat-bubble-outline',
    title: 'Mesaj Yok',
    description: 'Eşleştiğin kişilerle sohbet başlatmak için ilk mesajı sen at!',
  },
  'no-notifications': {
    icon: 'notifications-none',
    title: 'Bildirim Yok',
    description: 'Yeni eşleşme ve mesajlardan haberdar olmak için bildirimleri aç.',
  },
  'no-results': {
    icon: 'search-off',
    title: 'Sonuç Bulunamadı',
    description: 'Arama kriterlerini değiştirerek tekrar dene.',
  },
  'no-photos': {
    icon: 'photo-library',
    title: 'Fotoğraf Yok',
    description: 'Profiline fotoğraf ekleyerek eşleşme şansını artır!',
  },
  'error': {
    icon: 'error-outline',
    title: 'Bir Hata Oluştu',
    description: 'Bir şeyler yanlış gitti. Lütfen tekrar dene.',
  },
  'offline': {
    icon: 'wifi-off',
    title: 'Çevrimdışısın',
    description: 'İnternet bağlantını kontrol et ve tekrar dene.',
  },
  'custom': {
    icon: 'info-outline',
    title: 'Boş',
    description: 'Henüz burada bir şey yok.',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'custom',
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const { colors, isDark } = useTheme();
  const content = defaultContent[type];

  const displayIcon = icon || content.icon;
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  // İkon rengini tipe göre belirle
  const getIconColor = () => {
    switch (type) {
      case 'no-matches':
        return '#EC4899';
      case 'no-messages':
        return Colors.primary;
      case 'no-notifications':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'offline':
        return '#6B7280';
      default:
        return Colors.primary;
    }
  };

  const iconColor = getIconColor();

  return (
    <View style={styles.container}>
      {/* İkon Container */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${iconColor}15` },
        ]}
      >
        <View style={[styles.iconInner, { backgroundColor: `${iconColor}25` }]}>
          <MaterialIcons
            name={displayIcon as any}
            size={48}
            color={iconColor}
          />
        </View>
      </View>

      {/* Başlık */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {displayTitle}
      </Text>

      {/* Açıklama */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {displayDescription}
      </Text>

      {/* Aksiyonlar */}
      {(actionText || secondaryActionText) && (
        <View style={styles.actionsContainer}>
          {actionText && onAction && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{actionText}</Text>
            </TouchableOpacity>
          )}

          {secondaryActionText && onSecondaryAction && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onSecondaryAction}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                {secondaryActionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(19, 55, 236, 0.3)',
      } as any,
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmptyState;
