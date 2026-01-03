// Profile Card Component
// Discover ekranı için profil kartı - Glassmorphism tasarım

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = width * 1.3;

interface ProfileCardProps {
  user: {
    id?: string;
    name: string;
    age?: number;
    department?: string;
    university?: string;
    photo: string;
    interests?: string[];
    isActive?: boolean;
    isVerified?: boolean;
    badgeType?: 'verified_student' | 'international_student' | null;
  };
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const { colors } = useTheme();

  const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=400&background=6366f1&color=fff`;

  return (
    <View style={styles.card} accessibilityLabel={`${user.name} profil kartı`}>
      {/* User Photo */}
      <Image
        source={{ uri: user.photo || defaultPhoto }}
        style={styles.cardImage}
        resizeMode="cover"
        accessibilityLabel={`${user.name} fotoğrafı`}
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />

      {/* Verified Badge */}
      {user.badgeType && (
        <View style={styles.verifiedBadge}>
          <MaterialIcons
            name={user.badgeType === 'verified_student' ? 'verified' : 'school'}
            size={16}
            color="#fff"
          />
          <Text style={styles.verifiedText}>
            {user.badgeType === 'verified_student' ? 'Doğrulanmış' : 'Öğrenci'}
          </Text>
        </View>
      )}

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.infoHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {user.name}{user.age ? `, ${user.age}` : ''}
            </Text>
            {user.isActive && (
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Aktif</Text>
              </View>
            )}
          </View>

          {(user.department || user.university) && (
            <View style={styles.departmentRow}>
              <MaterialIcons name="school" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.departmentText}>
                {[user.department, user.university].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}
        </View>

        {/* Interests Tags */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.tagsContainer}>
            {user.interests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
            {user.interests.length > 3 && (
              <View style={[styles.tag, styles.moreTag]}>
                <Text style={styles.tagText}>+{user.interests.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  infoHeader: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#dcfce7',
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  departmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  moreTag: {
    backgroundColor: 'rgba(19, 55, 236, 0.4)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
  },
});

export default ProfileCard;
