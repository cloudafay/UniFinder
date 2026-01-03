// Glass Input Component
// Glassmorphism efektli input

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';

type InputType = 'text' | 'email' | 'password' | 'search' | 'number' | 'phone';
type InputVariant = 'default' | 'filled' | 'outline';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  variant?: InputVariant;
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  hint?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  dark?: boolean;
}

const GlassInput: React.FC<GlassInputProps> = ({
  placeholder,
  value,
  onChangeText,
  type = 'text',
  variant = 'default',
  label,
  icon,
  error,
  hint,
  disabled = false,
  containerStyle,
  dark = false,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const getInputStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.inputContainer,
      ...(dark ? styles.inputContainerDark : styles.inputContainerLight),
    };

    if (isFocused) {
      return {
        ...baseStyle,
        borderColor: Colors.primary,
        ...Platform.select({
          web: {
            boxShadow: '0 0 0 3px rgba(19, 55, 236, 0.15)',
          },
          default: {},
        }),
      };
    }

    if (error) {
      return {
        ...baseStyle,
        borderColor: '#ef4444',
      };
    }

    return baseStyle;
  };

  const textColor = dark ? '#fff' : '#1e293b';
  const placeholderColor = dark ? 'rgba(255,255,255,0.4)' : '#94a3b8';
  const iconColor = isFocused ? Colors.primary : (dark ? 'rgba(255,255,255,0.5)' : '#94a3b8');

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      )}
      
      <View style={[getInputStyle(), disabled && styles.disabled]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        
        {type === 'search' && !icon && (
          <MaterialIcons
            name="search"
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            icon && styles.inputWithIcon,
            (type === 'password') && styles.inputWithRightIcon,
          ]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={type === 'password' && !showPassword}
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoComplete={type === 'email' ? 'email' : type === 'password' ? 'password' : 'off'}
          editable={!disabled}
          accessibilityLabel={label || placeholder}
          accessibilityHint={hint}
          accessibilityState={{ disabled }}
          {...textInputProps}
        />
        
        {type === 'password' && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
        
        {type === 'email' && value.includes('@') && value.includes('.') && (
          <MaterialIcons
            name="check-circle"
            size={20}
            color="#22c55e"
            style={styles.rightIcon}
          />
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {hint && !error && (
        <View style={styles.hintContainer}>
          <MaterialIcons name="info-outline" size={14} color="#94a3b8" />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  inputContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
      default: {},
    }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  inputWithIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 36,
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default GlassInput;
