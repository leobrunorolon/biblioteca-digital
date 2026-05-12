import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const { colors, borderRadius, typography } = theme;

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    opacity: disabled || loading ? 0.6 : 1,
    ...(fullWidth && { width: "100%" }),
    ...sizeStyles[size],
    ...variantContainerStyles(variant, colors),
  };

  const textStyle: TextStyle = {
    fontSize: sizeTextSizes[size],
    fontWeight: typography.fontWeights.semibold,
    ...variantTextStyles(variant, colors),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style as ViewStyle]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[textStyle, leftIcon ? { marginLeft: 8 } : undefined, rightIcon ? { marginRight: 8 } : undefined]}>
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 12, paddingVertical: 8,  minHeight: 36 },
  md: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 48 },
  lg: { paddingHorizontal: 28, paddingVertical: 16, minHeight: 56 },
};

const sizeTextSizes: Record<Size, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

function variantContainerStyles(variant: Variant, colors: any): ViewStyle {
  switch (variant) {
    case "primary":   return { backgroundColor: colors.primary };
    case "secondary": return { backgroundColor: colors.surface };
    case "outline":   return { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary };
    case "ghost":     return { backgroundColor: "transparent" };
    case "danger":    return { backgroundColor: colors.error };
  }
}

function variantTextStyles(variant: Variant, colors: any): TextStyle {
  switch (variant) {
    case "primary":   return { color: colors.textInverse };
    case "secondary": return { color: colors.textPrimary };
    case "outline":   return { color: colors.primary };
    case "ghost":     return { color: colors.primary };
    case "danger":    return { color: colors.textInverse };
  }
}
