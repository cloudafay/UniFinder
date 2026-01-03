// Bildirim Mesajı Bileşeni
// Toast/Snackbar Komponenti

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
type ToastPosition = 'top' | 'bottom';

interface ToastConfig {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  action?: {
    label: string;
    onPress: () => void;
  };
  onClose?: () => void;
}

interface ToastProps extends ToastConfig {
  visible: boolean;
}

const typeConfig: Record<ToastType, { icon: keyof typeof MaterialIcons.glyphMap; color: string; bgColor: string }> = {
  success: {
    icon: 'check-circle',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  error: {
    icon: 'error',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  warning: {
    icon: 'warning',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  info: {
    icon: 'info',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  default: {
    icon: 'notifications',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
};

const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'default',
  title,
  message,
  duration = 3000,
  position = 'top',
  action,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setIsVisible(false);
      onClose?.();
    });
  };

  if (!isVisible) return null;

  const config = typeConfig[type];
  const positionStyle: ViewStyle = position === 'top'
    ? { top: insets.top + 16 }
    : { bottom: insets.bottom + 16 };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toast}>
        {/* Icon Area */}
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <MaterialIcons name={config.icon} size={20} color={config.color} />
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={[styles.message, title ? undefined : styles.messageSolo]} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {/* Action Area */}
        {action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              action.onPress();
              handleClose();
            }}
          >
            <Text style={[styles.actionText, { color: config.color }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Genel kullanım için Toast yöneticisi
type ToastOptions = Omit<ToastConfig, 'message'>;
type ToastShowFunction = (message: string, options?: ToastOptions) => void;

interface ToastManagerRef {
  show: ToastShowFunction;
  success: ToastShowFunction;
  error: ToastShowFunction;
  warning: ToastShowFunction;
  info: ToastShowFunction;
  hide: () => void;
}

let toastRef: ToastManagerRef | null = null;

export const ToastManager = {
  setRef: (ref: ToastManagerRef | null) => {
    toastRef = ref;
  },
  show: (message: string, options?: ToastOptions) => {
    toastRef?.show(message, options);
  },
  success: (message: string, options?: ToastOptions) => {
    toastRef?.success(message, options);
  },
  error: (message: string, options?: ToastOptions) => {
    toastRef?.error(message, options);
  },
  warning: (message: string, options?: ToastOptions) => {
    toastRef?.warning(message, options);
  },
  info: (message: string, options?: ToastOptions) => {
    toastRef?.info(message, options);
  },
  hide: () => {
    toastRef?.hide();
  },
};

// Toast Sağlayıcı Bileşeni
interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ref: ToastManagerRef = {
      show: (message, options) => {
        setToastConfig({ message, ...options });
        setVisible(true);
      },
      success: (message, options) => {
        setToastConfig({ message, type: 'success', ...options });
        setVisible(true);
      },
      error: (message, options) => {
        setToastConfig({ message, type: 'error', ...options });
        setVisible(true);
      },
      warning: (message, options) => {
        setToastConfig({ message, type: 'warning', ...options });
        setVisible(true);
      },
      info: (message, options) => {
        setToastConfig({ message, type: 'info', ...options });
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
      },
    };

    ToastManager.setRef(ref);

    return () => {
      ToastManager.setRef(null);
    };
  }, []);

  return (
    <>
      {children}
      {toastConfig && (
        <Toast
          visible={visible}
          {...toastConfig}
          onClose={() => {
            setVisible(false);
            toastConfig.onClose?.();
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      web: {
        pointerEvents: 'box-none',
      },
    }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Math.min(screenWidth - 32, 420),
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 19, 34, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  messageSolo: {
    fontSize: 14,
    color: '#fff',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
