// Video Arama Ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { videoCallService } from '../../services/videoCallService';
import { RootStackParamList } from '../../navigation/types';

type VideoCallRouteProp = RouteProp<RootStackParamList, 'VideoCall'>;

const VideoCallScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<VideoCallRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const { matchId, userName, userPhoto, callType } = route.params;
  
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    initiateCall();
    
    return () => {
      // Cleanup
      if (sessionId) {
        videoCallService.endCall(sessionId);
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const initiateCall = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await videoCallService.initiateCall(user.id, matchId, callType);
      
      if (error) {
        Alert.alert('Hata', 'Arama başlatılamadı');
        navigation.goBack();
        return;
      }

      if (data) {
        setSessionId(data.id);
        setCallStatus('ringing');

        // Arama durumu değişikliklerini dinle
        const subscription = videoCallService.subscribeToCallStatus(data.id, (call) => {
          if (call.status === 'connected') {
            setCallStatus('connected');
          } else if (call.status === 'rejected' || call.status === 'ended' || call.status === 'missed') {
            setCallStatus('ended');
            setTimeout(() => navigation.goBack(), 1500);
          }
        });

        // 30 saniye sonra cevapsız olarak işaretle
        setTimeout(() => {
          if (callStatus === 'ringing') {
            videoCallService.markAsMissed(data.id);
            setCallStatus('ended');
            Alert.alert('Cevapsız', `${userName} aramayı cevaplayamadı`);
            navigation.goBack();
          }
        }, 30000);
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      navigation.goBack();
    }
  };

  const handleEndCall = async () => {
    if (sessionId) {
      await videoCallService.endCall(sessionId);
    }
    navigation.goBack();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Bağlanıyor...';
      case 'ringing': return 'Çalıyor...';
      case 'connected': return formatDuration(callDuration);
      case 'ended': return 'Arama sonlandı';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
      {/* Background */}
      <View style={styles.background}>
        {!isVideoOff && callStatus === 'connected' ? (
          // Remote video placeholder
          <View style={styles.remoteVideo}>
            <Image source={{ uri: userPhoto }} style={styles.remoteVideoImage} blurRadius={20} />
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userPhoto }} style={styles.avatar} />
          </View>
        )}
      </View>

      {/* Top Info */}
      <View style={[styles.topInfo, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.callStatus}>{getStatusText()}</Text>
        {callType === 'audio' && (
          <View style={styles.audioIndicator}>
            <MaterialIcons name="phone" size={16} color="#fff" />
            <Text style={styles.audioText}>Sesli Arama</Text>
          </View>
        )}
      </View>

      {/* Local Video (PiP) */}
      {!isVideoOff && callStatus === 'connected' && (
        <View style={[styles.localVideo, { top: insets.top + 100 }]}>
          <View style={styles.localVideoPlaceholder}>
            <MaterialIcons name="person" size={40} color="#fff" />
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}>
        {/* Mute */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialIcons 
            name={isMuted ? 'mic-off' : 'mic'} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <MaterialIcons name="call-end" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Video Toggle */}
        {callType === 'video' && (
          <TouchableOpacity
            style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <MaterialIcons 
              name={isVideoOff ? 'videocam-off' : 'videocam'} 
              size={28} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}

        {/* Speaker (for audio calls) */}
        {callType === 'audio' && (
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="volume-up" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteVideoImage: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  callStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  audioText: {
    color: '#fff',
    fontSize: 13,
  },
  localVideo: {
    position: 'absolute',
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
  },
});

export default VideoCallScreen;
