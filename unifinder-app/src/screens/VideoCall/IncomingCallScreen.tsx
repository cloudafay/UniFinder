// Gelen Arama Ekranı
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Vibration,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { videoCallService } from '../../services/videoCallService';
import { RootStackParamList } from '../../navigation/types';

type IncomingCallRouteProp = RouteProp<RootStackParamList, 'IncomingCall'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const IncomingCallScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<IncomingCallRouteProp>();
  const { colors } = useTheme();
  
  const { sessionId, callerId, callerName, callerPhoto, callType } = route.params;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Titreşim
    const vibrationPattern = [0, 500, 200, 500];
    Vibration.vibrate(vibrationPattern, true);

    // Pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      Vibration.cancel();
    };
  }, []);

  const handleAccept = async () => {
    Vibration.cancel();
    await videoCallService.acceptCall(sessionId);
    
    // Video call ekranına git
    navigation.replace('VideoCall', {
      matchId: callerId,
      userName: callerName,
      userPhoto: callerPhoto,
      callType,
    });
  };

  const handleReject = async () => {
    Vibration.cancel();
    await videoCallService.rejectCall(sessionId);
    navigation.goBack();
  };

  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Caller Info */}
      <View style={[styles.callerInfo, { paddingTop: insets.top + 60 }]}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: callerPhoto }} style={styles.avatar} />
          </View>
        </Animated.View>
        
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callType}>
          {callType === 'video' ? 'Görüntülü Arama' : 'Sesli Arama'}
        </Text>
      </View>

      {/* Slide Hint */}
      <Animated.View style={[styles.slideHint, { transform: [{ translateY: slideTranslate }] }]}>
        <MaterialIcons name="keyboard-arrow-up" size={24} color="rgba(255,255,255,0.5)" />
        <Text style={styles.slideHintText}>Cevaplamak için yukarı kaydır</Text>
      </Animated.View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 50 }]}>
        {/* Reject */}
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
        >
          <MaterialIcons name="call-end" size={32} color="#fff" />
          <Text style={styles.actionText}>Reddet</Text>
        </TouchableOpacity>

        {/* Accept */}
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAccept}
        >
          <MaterialIcons 
            name={callType === 'video' ? 'videocam' : 'call'} 
            size={32} 
            color="#fff" 
          />
          <Text style={styles.actionText}>Cevapla</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  callerInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 76,
  },
  callerName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  callType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    marginTop: 8,
  },
  slideHint: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  slideHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  actionButton: {
    alignItems: 'center',
  },
  rejectButton: {},
  acceptButton: {},
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
});

// Reject ve Accept butonlarına özel stiller
const rejectButtonStyle = {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: '#ef4444',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const acceptButtonStyle = {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: '#22c55e',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

// StyleSheet'e ekle
Object.assign(styles, {
  rejectButton: rejectButtonStyle,
  acceptButton: acceptButtonStyle,
});

export default IncomingCallScreen;
