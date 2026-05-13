import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useBook, useSignedUrl, useUpdateProgress } from "../../hooks/useBooks";
import type { MainStackParamList } from "../../types";

type Route = RouteProp<MainStackParamList, "AudioPlayer">;

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
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

  const soundRef       = useRef<Audio.Sound | null>(null);
  const saveTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const barRef         = useRef<View>(null);
  const barLayout      = useRef({ x: 0, width: 0 }); // layout medido en onLayout
  const durationRef    = useRef(0);
  const isSeekingRef   = useRef(false);
  const positionRef    = useRef(0);
  const seekBlockUntil = useRef(0);

  const [isPlaying, setIsPlaying]     = useState(false);
  const [position, setPosition]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [speed, setSpeed]             = useState<Speed>(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSeeking, setIsSeeking]     = useState(false);
  const [seekPct, setSeekPct]         = useState(0);

  // Inicializar posición con el valor guardado apenas llega el libro
  useEffect(() => {
    if (book?.progress?.audioPosition && positionRef.current === 0) {
      positionRef.current = book.progress.audioPosition;
      setPosition(book.progress.audioPosition);
    }
  }, [book?.progress?.audioPosition]);

  // Cargar audio
  useEffect(() => {
    if (!signedUrl || !book) return;

    async function loadAudio() {
      setIsLoading(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });

        const savedMs = (book?.progress?.audioPosition ?? 0) * 1000;

        const { sound } = await Audio.Sound.createAsync(
          { uri: signedUrl! },
          { shouldPlay: false, positionMillis: savedMs, rate: speed },
          (status) => {
            if (!status.isLoaded) return;
            const dur = Math.floor((status.durationMillis ?? 0) / 1000);
            durationRef.current = dur;
            setDuration(dur);
            // Solo actualizar posición si no estamos en seek y pasó el bloqueo
            if (!isSeekingRef.current && Date.now() > seekBlockUntil.current) {
              const pos = Math.floor(status.positionMillis / 1000);
              positionRef.current = pos;
              setPosition(pos);
            }
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              updateProgress.mutate({ completed: true, audioPosition: 0 });
            }
          }
        );
        soundRef.current = sound;
      } catch (e) {
        console.error("Error cargando audio:", e);
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

  // Guardar progreso cada 30s
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      if (isPlaying && positionRef.current > 0) {
        updateProgress.mutate({ audioPosition: positionRef.current });
      }
    }, 30000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [isPlaying]);

  // ── Seek por toque/arrastre en la barra ─────────────────
  // Calcula el porcentaje a partir de la posición X del toque
  // usando el layout medido en onLayout (coordenadas relativas al componente)
  function pctFromTouch(locationX: number): number {
    const w = barLayout.current.width;
    if (w <= 0) return 0;
    return Math.max(0, Math.min(1, locationX / w));
  }

  function handleBarTouchStart(e: any) {
    isSeekingRef.current = true;
    setIsSeeking(true);
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setSeekPct(pct * 100);
  }

  function handleBarTouchMove(e: any) {
    if (!isSeekingRef.current) return;
    const pct = pctFromTouch(e.nativeEvent.locationX);
    setSeekPct(pct * 100);
  }

  async function handleBarTouchEnd(e: any) {
    if (!isSeekingRef.current) return;
    const pct    = pctFromTouch(e.nativeEvent.locationX);
    const newPos = Math.round(pct * durationRef.current);
    seekBlockUntil.current = Date.now() + 2000;
    positionRef.current    = newPos;
    setPosition(newPos);
    setSeekPct(pct * 100);
    isSeekingRef.current = false;
    setIsSeeking(false);
    await soundRef.current?.setPositionAsync(newPos * 1000);
  }

  // ── Controles ────────────────────────────────────────────
  async function togglePlay() {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      updateProgress.mutate({ audioPosition: positionRef.current });
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function seek(seconds: number) {
    if (!soundRef.current || durationRef.current === 0) return;
    const newPos = Math.max(0, Math.min(positionRef.current + seconds, durationRef.current));
    seekBlockUntil.current = Date.now() + 2000;
    positionRef.current    = newPos;
    setPosition(newPos);
    await soundRef.current.setPositionAsync(newPos * 1000);
  }

  async function setSpeedValue(s: Speed) {
    setSpeed(s);
    await soundRef.current?.setRateAsync(s, true);
  }

  function handleClose() {
    soundRef.current?.pauseAsync();
    updateProgress.mutate({ audioPosition: positionRef.current });
    navigation.goBack();
  }

  function formatTime(secs: number): string {
    const h   = Math.floor(secs / 3600);
    const m   = Math.floor((secs % 3600) / 60);
    const s   = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  const displayPos  = isSeeking ? (seekPct / 100) * duration : position;
  const progressPct = duration > 0 ? Math.min(100, (displayPos / duration) * 100) : 0;
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
        <Text style={{
          fontSize: typography.fontSizes.xl,
          fontWeight: typography.fontWeights.bold,
          color: colors.textPrimary,
          textAlign: "center",
        }}>
          {book?.title ?? "Cargando..."}
        </Text>
        <Text style={{
          fontSize: typography.fontSizes.base,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.xs,
        }}>
          {book?.author}
        </Text>
      </View>

      {/* ── Barra de progreso ── */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
        {/* Zona de toque — altura generosa para facilitar el arrastre */}
        <View
          ref={barRef}
          style={{ height: 48, justifyContent: "center", marginVertical: spacing.md }}
          onLayout={(e) => {
            barLayout.current = {
              x: e.nativeEvent.layout.x,
              width: e.nativeEvent.layout.width,
            };
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleBarTouchStart}
          onResponderMove={handleBarTouchMove}
          onResponderRelease={handleBarTouchEnd}
          onResponderTerminate={() => { isSeekingRef.current = false; setIsSeeking(false); }}
        >
          {/* Track */}
          <View style={{ height: 6, backgroundColor: colors.surface, borderRadius: 3 }}>
            <View style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: isSeeking ? colors.primaryLight : colors.primary,
              borderRadius: 3,
            }} />
          </View>
          {/* Thumb */}
          <View style={{
            position: "absolute",
            left: `${progressPct}%`,
            marginLeft: -12,
            top: 12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            borderWidth: 2.5,
            borderColor: colors.background,
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }} />
        </View>

        {/* Tiempos */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{
            fontSize: typography.fontSizes.xs,
            color: isSeeking ? colors.primary : colors.textTertiary,
            fontWeight: isSeeking ? "700" : "400",
          }}>
            {formatTime(Math.round(displayPos))}
          </Text>
          <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textTertiary }}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Velocidades */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: spacing.xs,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xl,
      }}>
        {SPEEDS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSpeedValue(s)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: borderRadius.md,
              backgroundColor: speed === s ? colors.primary : colors.surface,
              alignItems: "center",
            }}
          >
            <Text style={{
              fontSize: typography.fontSizes.xs,
              fontWeight: typography.fontWeights.bold,
              color: speed === s ? colors.textInverse : colors.textSecondary,
            }}>
              {s}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controles */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: spacing.xl,
        marginTop: spacing.sm,
      }}>
        {/* -5s */}
        <TouchableOpacity onPress={() => seek(-5)} style={{ alignItems: "center", padding: spacing.sm }}>
          <Text style={{ fontSize: 32 }}>⏪</Text>
          <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>5s</Text>
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

        {/* +5s */}
        <TouchableOpacity onPress={() => seek(5)} style={{ alignItems: "center", padding: spacing.sm }}>
          <Text style={{ fontSize: 32 }}>⏩</Text>
          <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>5s</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <Text style={{
          textAlign: "center",
          color: colors.textTertiary,
          fontSize: typography.fontSizes.xs,
          marginTop: spacing.md,
        }}>
          {loadingUrl ? "Obteniendo audio..." : "Cargando..."}
        </Text>
      )}
    </View>
  );
}
