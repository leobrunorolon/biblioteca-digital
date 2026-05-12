import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useBook, useSignedUrl, useUpdateProgress } from "../../hooks/useBooks";
import type { MainStackParamList } from "../../types";

type Route = RouteProp<MainStackParamList, "AudioPlayer">;

const SPEEDS = [1, 1.5, 2] as const;
type Speed = typeof SPEEDS[number];

export function AudioPlayerScreen() {
  const route      = useRoute<Route>();
  const navigation = useNavigation();
  const { bookId } = route.params;
  const { theme }  = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets     = useSafeAreaInsets();

  const { data: book }    = useBook(bookId);
  const { data: signedUrl, isLoading: loadingUrl } = useSignedUrl(bookId, "audio");
  const updateProgress    = useUpdateProgress(bookId);

  const soundRef  = useRef<Audio.Sound | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [speed, setSpeed]         = useState<Speed>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar audio cuando tengamos la URL
  useEffect(() => {
    if (!signedUrl) return;

    async function loadAudio() {
      setIsLoading(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: signedUrl! },
          {
            shouldPlay: false,
            positionMillis: (book?.progress?.audioPosition ?? 0) * 1000,
            rate: speed,
          },
          (status) => {
            if (status.isLoaded) {
              setPosition(Math.floor(status.positionMillis / 1000));
              setDuration(Math.floor((status.durationMillis ?? 0) / 1000));
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                updateProgress.mutate({ completed: true, audioPosition: 0 });
              }
            }
          }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error("Error cargando audio:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAudio();

    return () => {
      soundRef.current?.unloadAsync();
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [signedUrl]);

  // Guardar progreso cada 30 segundos
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      if (isPlaying && position > 0) {
        updateProgress.mutate({ audioPosition: position });
      }
    }, 30000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [isPlaying, position]);

  async function togglePlay() {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      updateProgress.mutate({ audioPosition: position });
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function seek(seconds: number) {
    if (!soundRef.current) return;
    const newPos = Math.max(0, Math.min(position + seconds, duration));
    await soundRef.current.setPositionAsync(newPos * 1000);
  }

  async function cycleSpeed() {
    const idx      = SPEEDS.indexOf(speed);
    const newSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(newSpeed);
    await soundRef.current?.setRateAsync(newSpeed, true);
  }

  function handleClose() {
    soundRef.current?.pauseAsync();
    updateProgress.mutate({ audioPosition: position });
    navigation.goBack();
  }

  function formatTime(secs: number): string {
    const h   = Math.floor(secs / 3600);
    const m   = Math.floor((secs % 3600) / 60);
    const s   = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  const progressPct = duration > 0 ? (position / duration) * 100 : 0;
  const loading     = loadingUrl || isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.xl }}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSizes.base }}>✕</Text>
        </TouchableOpacity>
        <Text style={{
          flex: 1, textAlign: "center",
          fontSize: typography.fontSizes.sm,
          fontWeight: typography.fontWeights.semibold,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}>
          Audiolibro
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Portada */}
      <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
        {book?.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={{ width: 220, height: 220, borderRadius: borderRadius.xl, ...shadows.lg }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: 220, height: 220, borderRadius: borderRadius.xl,
            backgroundColor: colors.surface,
            alignItems: "center", justifyContent: "center",
            ...shadows.lg,
          }}>
            <Text style={{ fontSize: 64 }}>🎧</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
        <Text style={{ fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, textAlign: "center" }}>
          {book?.title ?? "Cargando..."}
        </Text>
        <Text style={{ fontSize: typography.fontSizes.base, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs }}>
          {book?.author}
        </Text>
      </View>

      {/* Barra de progreso */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <View style={{ height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: "hidden" }}>
          <View style={{ width: `${progressPct}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 2 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs }}>
          <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary }}>{formatTime(position)}</Text>
          <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary }}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controles */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: spacing.xl, marginTop: spacing.md }}>

        {/* Velocidad */}
        <TouchableOpacity
          onPress={cycleSpeed}
          style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.md, minWidth: 48, alignItems: "center" }}
        >
          <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.primary }}>
            {speed}x
          </Text>
        </TouchableOpacity>

        {/* -30s */}
        <TouchableOpacity onPress={() => seek(-30)} style={{ padding: spacing.sm }}>
          <Text style={{ fontSize: 36 }}>⏪</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          onPress={togglePlay}
          disabled={loading}
          style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center",
            ...shadows.md,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={{ fontSize: 28 }}>{isPlaying ? "⏸" : "▶️"}</Text>
          }
        </TouchableOpacity>

        {/* +30s */}
        <TouchableOpacity onPress={() => seek(30)} style={{ padding: spacing.sm }}>
          <Text style={{ fontSize: 36 }}>⏩</Text>
        </TouchableOpacity>

        <View style={{ width: 48 }} />
      </View>

      {loading && (
        <Text style={{ textAlign: "center", color: colors.textTertiary, fontSize: typography.fontSizes.xs, marginTop: spacing.md }}>
          {loadingUrl ? "Obteniendo audio..." : "Cargando..."}
        </Text>
      )}
    </View>
  );
}
