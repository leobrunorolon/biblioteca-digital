import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MasonicLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
}

/**
 * Logo masónico: escuadra + compás + G
 * Símbolo clásico de la masonería
 */
export function MasonicLogo({ size = 80, color = "#C9A84C", showText = true }: MasonicLogoProps) {
  const fontSize = size * 0.55;
  const subSize  = size * 0.28;

  return (
    <View style={{ alignItems: "center" }}>
      {/* Símbolo principal */}
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Escuadra y compás (usando caracteres Unicode) */}
        <Text style={{ fontSize: fontSize, color, lineHeight: fontSize * 1.1 }}>
          ⊾
        </Text>
        {/* Letra G central */}
        <View
          style={{
            position: "absolute",
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: size * 0.19,
            backgroundColor: color + "20",
            borderWidth: 1.5,
            borderColor: color,
            alignItems: "center",
            justifyContent: "center",
            bottom: size * 0.08,
          }}
        >
          <Text
            style={{
              fontSize: subSize,
              color,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            G
          </Text>
        </View>
      </View>

      {/* Texto */}
      {showText && (
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              fontSize: size * 0.13,
              color,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Logia
          </Text>
          <Text
            style={{
              fontSize: size * 0.16,
              color,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            Almirante Howard
          </Text>
          <Text
            style={{
              fontSize: size * 0.12,
              color: color + "99",
              letterSpacing: 3,
            }}
          >
            Nº 67
          </Text>
        </View>
      )}
    </View>
  );
}
