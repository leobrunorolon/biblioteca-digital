import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  secureToggle,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const { colors, borderRadius, typography, spacing } = theme;
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.borderFocus
    : colors.border;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text
          style={{
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.backgroundCard,
          borderWidth: 1.5,
          borderColor,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.md,
          minHeight: 48,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
        )}

        <TextInput
          style={[
            {
              flex: 1,
              fontSize: typography.fontSizes.base,
              color: colors.textPrimary,
              paddingVertical: 12,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isSecure}
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
          {...props}
        />

        {secureToggle && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={{ marginLeft: spacing.sm }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {isSecure ? "Mostrar" : "Ocultar"}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureToggle && (
          <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontSize: typography.fontSizes.xs,
            color: colors.error,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text
          style={{
            fontSize: typography.fontSizes.xs,
            color: colors.textTertiary,
            marginTop: spacing.xs,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}
