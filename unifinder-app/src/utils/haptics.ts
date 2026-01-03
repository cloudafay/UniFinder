// Haptic Feedback Utility
// Titreşim efektleri için yardımcı fonksiyonlar

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptic türleri
type HapticType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Haptic feedback tetikle
 * @param type - Haptic türü
 */
export const triggerHaptic = async (type: HapticType = 'light') => {
  // Web'de haptic desteklenmiyor
  if (Platform.OS === 'web') {
    return;
  }

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptic desteklenmiyorsa sessizce devam et
    console.log('Haptic feedback not available');
  }
};

// Önceden tanımlı haptic aksiyonları
export const haptics = {
  // Genel
  tap: () => triggerHaptic('light'),
  press: () => triggerHaptic('medium'),
  longPress: () => triggerHaptic('heavy'),
  
  // Swipe aksiyonları
  swipeStart: () => triggerHaptic('light'),
  swipeEnd: () => triggerHaptic('medium'),
  swipeLike: () => triggerHaptic('success'),
  swipeNope: () => triggerHaptic('light'),
  swipeSuperLike: () => triggerHaptic('heavy'),
  
  // Match
  match: () => triggerHaptic('success'),
  
  // Mesaj
  messageSent: () => triggerHaptic('light'),
  messageReceived: () => triggerHaptic('selection'),
  
  // Navigasyon
  tabChange: () => triggerHaptic('selection'),
  modalOpen: () => triggerHaptic('light'),
  modalClose: () => triggerHaptic('light'),
  
  // Form
  inputFocus: () => triggerHaptic('selection'),
  buttonPress: () => triggerHaptic('light'),
  switchToggle: () => triggerHaptic('selection'),
  
  // Uyarılar
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  
  // Özel
  selection: () => triggerHaptic('selection'),
};

export default haptics;
