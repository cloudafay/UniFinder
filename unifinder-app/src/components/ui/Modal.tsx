// Modal Component
// Popup/dialog bileşeni

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ModalSize = 'sm' | 'md' | 'lg' | 'full';
type ModalPosition = 'center' | 'bottom';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  dark?: boolean;
  footer?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const sizeWidths: Record<ModalSize, number> = {
  sm: Math.min(320, screenWidth - 48),
  md: Math.min(400, screenWidth - 32),
  lg: Math.min(500, screenWidth - 24),
  full: screenWidth,
};

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  dark = true,
  footer,
  style,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(position === 'bottom' ? 300 : 50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'bottom' ? 300 : 50,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, position]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const modalWidth = sizeWidths[size];
  const isFullSize = size === 'full';
  const isBottom = position === 'bottom';

  const containerStyle: ViewStyle = {
    width: modalWidth,
    maxHeight: isFullSize ? screenHeight : screenHeight * 0.9,
    ...(isBottom && {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingBottom: insets.bottom,
    }),
  };

  const backgroundStyle = dark ? styles.contentDark : styles.contentLight;
  const textColor = dark ? '#fff' : '#1e293b';
  const subtitleColor = dark ? 'rgba(255,255,255,0.6)' : '#64748b';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: fadeAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.container,
            isBottom ? styles.containerBottom : styles.containerCenter,
            { pointerEvents: 'box-none' as const },
          ]}
        >
          <Animated.View
            style={[
              styles.content,
              backgroundStyle,
              containerStyle,
              {
                transform: [
                  isBottom ? { translateY: slideAnim } : { translateY: slideAnim },
                ],
                opacity: fadeAnim,
              },
              style,
            ]}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {title && (
                    <Text style={[styles.title, { color: textColor }]}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text style={[styles.subtitle, { color: subtitleColor }]}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                {showCloseButton && (
                  <TouchableOpacity
                    style={[styles.closeButton, dark && styles.closeButtonDark]}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={dark ? '#fff' : '#64748b'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Handle for bottom sheet */}
            {isBottom && (
              <View style={styles.handleContainer}>
                <View style={[styles.handle, dark && styles.handleDark]} />
              </View>
            )}

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {/* Footer */}
            {footer && (
              <View style={[styles.footer, dark && styles.footerDark]}>
                {footer}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerCenter: {
    justifyContent: 'center',
    padding: 16,
  },
  containerBottom: {
    justifyContent: 'flex-end',
  },
  content: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      default: {
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
    }),
  },
  contentLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  contentDark: {
    backgroundColor: 'rgba(16, 19, 34, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  handleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    maxHeight: screenHeight * 0.6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  footerDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Modal;
