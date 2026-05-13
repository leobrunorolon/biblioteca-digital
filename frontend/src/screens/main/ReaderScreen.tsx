import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  ScrollView,
  PanResponder,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { useBook, useUpdateProgress, useAddBookmark } from "../../hooks/useBooks";
import { useReaderStore } from "../../store/reader.store";
import { supabase } from "../../services/supabase";
import type { MainStackParamList } from "../../types";

type Route = RouteProp<MainStackParamList, "Reader">;

const READER_THEMES = {
  light: { bg: "#FFFFFF", text: "#1a1a1a", label: "☀️ Claro" },
  dark:  { bg: "#111827", text: "#F3F4F6", label: "🌙 Oscuro" },
  sepia: { bg: "#F5E6C8", text: "#3d2b1f", label: "📜 Sepia" },
};

const FONT_SIZES = [16, 18, 20, 22, 24, 28, 32];

export function ReaderScreen() {
  const navigation = useNavigation();
  const route      = useRoute<Route>();
  const { bookId } = route.params;
  const { theme }  = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets     = useSafeAreaInsets();

  const { data: book }   = useBook(bookId);
  const updateProgress   = useUpdateProgress(bookId);
  const addBookmark      = useAddBookmark(bookId);
  const { settings, updateSettings } = useReaderStore();

  const scrollRef  = useRef<ScrollView>(null);
  const startTime  = useRef(Date.now());
  const saveTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollY    = useRef(0);
  const ttsBarWidth = useRef(0); // ancho de la barra de progreso TTS

  const [content, setContent]           = useState<string>("");
  const [pdfUrl, setPdfUrl]             = useState<string>("");
  const [pageText, setPageText]         = useState<string>("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTTSBar, setShowTTSBar]     = useState(false);
  const [progress, setProgress]         = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewHeight, setViewHeight]       = useState(0);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);

  // ── TTS state ────────────────────────────────────────────
  // "idle" | "playing" | "paused"
  const [ttsState, setTtsState]         = useState<"idle" | "playing" | "paused">("idle");
  const [ttsSpeed, setTtsSpeed]         = useState(1.0);
  const [ttsChunkIndex, setTtsChunkIndex] = useState(0);
  const ttsChunks   = useRef<string[]>([]);
  const ttsIndexRef = useRef(0);   // ref para acceder dentro de callbacks
  const ttsStateRef = useRef<"idle" | "playing" | "paused">("idle");
  const ttsSpeedRef = useRef(1.0);

  const TTS_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // La voz se lee del store (persiste entre sesiones)
  const selectedVoice   = settings.voiceIdentifier;
  const setSelectedVoice = (id: string | undefined) => updateSettings({ voiceIdentifier: id });

  // isSpeaking para compatibilidad con el resto del código
  const isSpeaking = ttsState === "playing";

  // Clave de storage para guardar posición TTS por libro
  const TTS_STORAGE_KEY = `@biblioteca/tts-position-${bookId}`;

  const rt = READER_THEMES[settings.theme];

  // ── Cargar contenido del libro ───────────────────────────
  useEffect(() => {
    if (!book?.fileUrl) return;
    setLoading(true);
    setError("");

    async function loadContent() {
      try {
        const format = book!.format;

        // PDF / Word / PPT → obtener URL pública para visor
        // Usar el format de la DB, no la extensión de la URL
        if (format === "pdf" || format === "doc" || format === "ppt") {
          let fileUrl = book!.fileUrl;
          if (fileUrl.includes("/storage/v1/object/books/")) {
            fileUrl = fileUrl.replace(
              "/storage/v1/object/books/",
              "/storage/v1/object/public/books/"
            );
          }
          setPdfUrl(fileUrl);
          setLoading(false);
          return;
        }

        // TXT / EPUB → obtener URL firmada y cargar texto
        let urlToFetch = book!.fileUrl;
        if (urlToFetch.includes("/storage/v1/object/books/")) {
          const pathMatch = urlToFetch.match(/\/storage\/v1\/object\/books\/(.+)/);
          if (pathMatch) {
            const { data, error } = await supabase.storage
              .from("books")
              .createSignedUrl(pathMatch[1], 3600);
            if (error) throw error;
            urlToFetch = data.signedUrl;
          }
        }

        const res = await fetch(urlToFetch);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();

        if (text.trim().startsWith("<")) {
          const cleaned = text
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\s{3,}/g, "\n\n")
            .trim();
          setContent(cleaned);
        } else {
          setContent(text);
        }
        setLoading(false);
      } catch (err) {
        setError("No se pudo cargar el libro. Verificá tu conexión.");
        setLoading(false);
      }
    }

    loadContent();
  }, [book?.fileUrl]);

  // ── Retomar posición guardada cuando el contenido carga ──
  useEffect(() => {
    if (!loading && content && book?.progress?.progressPercent) {
      const savedProgress = book.progress.progressPercent;
      setProgress(savedProgress);
      // Esperar a que el layout esté listo antes de hacer scroll
      setTimeout(() => {
        if (scrollRef.current && contentHeight > 0 && viewHeight > 0) {
          const total    = contentHeight - viewHeight;
          const targetY  = (savedProgress / 100) * total;
          scrollRef.current.scrollTo({ y: targetY, animated: false });
        }
      }, 500);
    }
  }, [loading, content, contentHeight, viewHeight]);

  // ── Auto-guardar progreso cada 15 segundos ───────────────
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      if (progress > 0) {
        updateProgress.mutate({ progressPercent: progress });
      }
    }, 15000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [progress]);
  // ── Cargar voces disponibles ─────────────────────────────
  useEffect(() => {
    Speech.getAvailableVoicesAsync().then((voices) => {
      const spanishVoices = voices.filter(v =>
        v.language?.startsWith("es") || v.identifier?.includes("es")
      );
      const list = spanishVoices.length > 0 ? spanishVoices : voices.slice(0, 15);
      setAvailableVoices(list);

      // Solo asignar voz por defecto si el usuario no tiene una guardada
      if (!settings.voiceIdentifier && list.length > 0) {
        const maleVoice = list.find(v =>
          v.identifier?.toLowerCase().includes("male") ||
          v.name?.toLowerCase().includes("male") ||
          v.name?.toLowerCase().includes("jorge") ||
          v.name?.toLowerCase().includes("diego") ||
          v.name?.toLowerCase().includes("carlos")
        );
        if (maleVoice) updateSettings({ voiceIdentifier: maleVoice.identifier });
      }
    }).catch(() => {});
  }, []);

  // ── Interceptar botón físico de Android y swipe back ────
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Guardar posición TTS y progreso antes de salir
      if (ttsChunks.current.length > 0) {
        saveTtsPosition(ttsIndexRef.current, ttsChunks.current);
      }
      Speech.stop();
      ttsStateRef.current = "idle";
      ttsChunks.current = [];
      if (saveTimer.current) clearInterval(saveTimer.current);
      const readSeconds = Math.floor((Date.now() - startTime.current) / 1000);
      if (progress > 0 || readSeconds > 5) {
        updateProgress.mutate({
          progressPercent: progress,
          readTimeSeconds: readSeconds,
          completed: progress >= 95,
        });
      }
    });
    return unsubscribe;
  }, [navigation, progress]);

  // ── Calcular progreso por scroll ─────────────────────────
  function handleScroll(event: any) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const total = contentSize.height - layoutMeasurement.height;
    if (total > 0) {
      scrollY.current = contentOffset.y;
      const pct = Math.round((contentOffset.y / total) * 100);
      setProgress(Math.min(pct, 100));
    }
  }

  function handleClose() {
    navigation.goBack(); // beforeRemove se encarga de guardar
  }

  function handleBookmark() {
    addBookmark.mutate({ page: 0, note: `Marcador al ${progress}%` });
    Alert.alert("🔖 Marcador guardado", `Guardado al ${progress}%`);
  }

  // ── PanResponder para barra TTS arrastrable ─────────────
  const ttsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: async (evt) => {
        // Al tocar, saltar a esa posición
        if (ttsBarWidth.current <= 0 || ttsChunks.current.length === 0) return;
        const x = evt.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(1, x / ttsBarWidth.current));
        const newIndex = Math.round(pct * (ttsChunks.current.length - 1));
        await Speech.stop();
        ttsIndexRef.current = newIndex;
        setTtsChunkIndex(newIndex);
        if (ttsStateRef.current === "playing") {
          speakChunk(newIndex);
        }
      },
      onPanResponderMove: async (evt) => {
        if (ttsBarWidth.current <= 0 || ttsChunks.current.length === 0) return;
        const x = evt.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(1, x / ttsBarWidth.current));
        const newIndex = Math.round(pct * (ttsChunks.current.length - 1));
        ttsIndexRef.current = newIndex;
        setTtsChunkIndex(newIndex);
      },
      onPanResponderRelease: async () => {
        await Speech.stop();
        if (ttsStateRef.current === "playing") {
          speakChunk(ttsIndexRef.current);
        }
      },
    })
  ).current;

  // ── Guardar / restaurar posición TTS ────────────────────
  async function saveTtsPosition(index: number, chunks: string[]) {
    try {
      await AsyncStorage.setItem(
        TTS_STORAGE_KEY,
        JSON.stringify({ index, total: chunks.length })
      );
    } catch {}
  }

  async function restoreTtsPosition(): Promise<number> {
    try {
      const saved = await AsyncStorage.getItem(TTS_STORAGE_KEY);
      if (saved) {
        const { index } = JSON.parse(saved);
        return typeof index === "number" ? index : 0;
      }
    } catch {}
    return 0;
  }

  // ── TTS: dividir texto en chunks de ~300 palabras ───────
  function buildChunks(text: string): string[] {
    // Dividir por oraciones para no cortar palabras
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > 800) {
        if (current.trim()) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.substring(0, 800)];
  }

  function speakChunk(index: number) {
    if (index >= ttsChunks.current.length) {
      // Terminó todo el texto
      setTtsState("idle");
      ttsStateRef.current = "idle";
      setTtsChunkIndex(0);
      ttsIndexRef.current = 0;
      return;
    }
    const chunk = ttsChunks.current[index];
    setTtsChunkIndex(index);
    ttsIndexRef.current = index;

    Speech.speak(chunk, {
      language: "es-ES",
      rate: ttsSpeedRef.current,
      pitch: 1.0,
      voice: selectedVoice,
      onDone: () => {
        if (ttsStateRef.current === "playing") {
          speakChunk(ttsIndexRef.current + 1);
        }
      },
      onError: () => {
        setTtsState("idle");
        ttsStateRef.current = "idle";
      },
      onStopped: () => {
        // No hacer nada — puede ser pausa intencional
      },
    });
  }

  async function ttsPlay() {
    const textToRead = pdfUrl ? pageText : content;
    if (!textToRead) {
      Alert.alert("Sin contenido", pdfUrl
        ? "El PDF todavía está extrayendo el texto, esperá unos segundos"
        : "Esperá a que el libro termine de cargar"
      );
      return;
    }

    if (ttsState === "paused") {
      // Reanudar desde donde quedó
      setTtsState("playing");
      ttsStateRef.current = "playing";
      speakChunk(ttsIndexRef.current);
      return;
    }

    // Construir chunks si no existen
    if (ttsChunks.current.length === 0) {
      ttsChunks.current = buildChunks(textToRead);
      // Restaurar posición guardada
      const savedIndex = await restoreTtsPosition();
      if (savedIndex > 0 && savedIndex < ttsChunks.current.length) {
        ttsIndexRef.current = savedIndex;
        setTtsChunkIndex(savedIndex);
      }
    }

    setTtsState("playing");
    ttsStateRef.current = "playing";
    setShowTTSBar(true);
    speakChunk(ttsIndexRef.current);
  }

  async function ttsPause() {
    await Speech.stop();
    setTtsState("paused");
    ttsStateRef.current = "paused";
    // Guardar posición al pausar
    await saveTtsPosition(ttsIndexRef.current, ttsChunks.current);
  }

  async function ttsStop() {
    await Speech.stop();
    // Guardar posición antes de limpiar
    await saveTtsPosition(ttsIndexRef.current, ttsChunks.current);
    setTtsState("idle");
    ttsStateRef.current = "idle";
    setTtsChunkIndex(0);
    ttsIndexRef.current = 0;
    ttsChunks.current = [];
    setShowTTSBar(false);
  }

  async function ttsSkipBack() {
    await Speech.stop();
    const newIndex = Math.max(0, ttsIndexRef.current - 3);
    ttsIndexRef.current = newIndex;
    setTtsChunkIndex(newIndex);
    if (ttsStateRef.current === "playing") {
      speakChunk(newIndex);
    }
  }

  async function ttsSkipForward() {
    await Speech.stop();
    const newIndex = Math.min(ttsChunks.current.length - 1, ttsIndexRef.current + 3);
    ttsIndexRef.current = newIndex;
    setTtsChunkIndex(newIndex);
    if (ttsStateRef.current === "playing") {
      speakChunk(newIndex);
    }
  }

  async function ttsSetSpeed(speed: number) {
    ttsSpeedRef.current = speed;
    setTtsSpeed(speed);
    // Si está reproduciendo, reiniciar el chunk actual con la nueva velocidad
    if (ttsStateRef.current === "playing") {
      await Speech.stop();
      speakChunk(ttsIndexRef.current);
    }
  }

  // Mantener compatibilidad con el botón de la barra superior
  async function toggleSpeech() {
    if (ttsState === "playing") {
      await ttsPause();
    } else {
      await ttsPlay();
    }
  }

  const ttsProgress = ttsChunks.current.length > 0
    ? Math.round((ttsChunkIndex / ttsChunks.current.length) * 100)
    : 0;

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: rt.bg }}>
      <StatusBar
        barStyle={settings.theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={rt.bg}
      />

      {/* Barra superior — siempre visible */}
      <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: rt.bg,
          borderBottomWidth: 1,
          borderBottomColor: settings.theme === "dark" ? "#374151" : "#E5E7EB",
        }}>
          <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
            <Text style={{ fontSize: 24, color: rt.text }}>←</Text>
          </TouchableOpacity>

          <Text numberOfLines={1} style={{
            flex: 1, textAlign: "center",
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.semibold,
            color: rt.text,
            marginHorizontal: spacing.sm,
          }}>
            {book?.title ?? "Cargando..."}
          </Text>

          <TouchableOpacity
            onPress={toggleSpeech}
            style={{
              padding: 8, marginRight: 4,
              backgroundColor: isSpeaking ? colors.primary + "30" : "transparent",
              borderRadius: borderRadius.md,
            }}
          >
            <Text style={{ fontSize: 22 }}>
              {ttsState === "playing" ? "⏸️" : ttsState === "paused" ? "▶️" : "🔊"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBookmark} style={{ padding: 8, marginRight: 4 }}>
            <Text style={{ fontSize: 22 }}>🔖</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSettings(true)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

      {/* Contenido */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: rt.text, marginTop: spacing.md, fontSize: typography.fontSizes.base }}>
            Cargando libro...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>😕</Text>
          <Text style={{ color: rt.text, fontSize: typography.fontSizes.base, textAlign: "center" }}>{error}</Text>
        </View>
      ) : pdfUrl ? (
        // PDF / Word / PPT → PDF.js para PDF, Google Docs para Office
        <WebView
          source={{
            html: pdfUrl.toLowerCase().includes(".pdf") ? `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${rt.bg}; display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
    #toolbar { background: #1f2937; padding: 8px 12px; display: flex; align-items: center; gap: 8px; color: white; font-size: 13px; }
    button { background: #374151; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; }
    #page-info { flex: 1; text-align: center; }
    #pdf-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 12px; gap: 12px; }
    canvas { max-width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white; }
    #loading { color: ${rt.text}; font-size: 16px; margin-top: 40px; }
  </style>
</head>
<body>
  <div id="toolbar">
    <button onclick="prevPage()">◀</button>
    <span id="page-info">Cargando...</span>
    <button onclick="nextPage()">▶</button>
    <button onclick="zoomOut()">−</button>
    <button onclick="zoomIn()">+</button>
  </div>
  <div id="pdf-container"><div id="loading">Cargando PDF...</div></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let pdfDoc = null, currentPage = 1, scale = 1.4;
    const container = document.getElementById('pdf-container');
    async function renderPage(num) {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height; canvas.width = viewport.width;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      return canvas;
    }
    async function loadPDF() {
      try {
        pdfDoc = await pdfjsLib.getDocument('${pdfUrl}').promise;
        document.getElementById('loading').remove();
        // Retomar desde la página guardada
        const savedPage = ${book?.progress?.progressPercent ? `Math.max(1, Math.round((${book.progress.progressPercent} / 100) * pdfDoc.numPages))` : '1'};
        currentPage = Math.min(savedPage, pdfDoc.numPages);
        updateInfo();
        container.appendChild(await renderPage(currentPage));
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const p = await pdfDoc.getPage(i);
          const tc = await p.getTextContent();
          fullText += tc.items.map(item => item.str).join(' ') + '\\n';
        }
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'text', value: fullText.substring(0, 50000) }));
      } catch(e) { document.getElementById('loading').textContent = 'Error: ' + e.message; }
    }
    function updateInfo() { document.getElementById('page-info').textContent = 'Página ' + currentPage + ' / ' + pdfDoc.numPages; }
    async function prevPage() { if (currentPage <= 1) return; currentPage--; container.innerHTML = ''; updateInfo(); container.appendChild(await renderPage(currentPage)); window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', value: Math.round((currentPage/pdfDoc.numPages)*100) })); }
    async function nextPage() { if (currentPage >= pdfDoc.numPages) return; currentPage++; container.innerHTML = ''; updateInfo(); container.appendChild(await renderPage(currentPage)); window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', value: Math.round((currentPage/pdfDoc.numPages)*100) })); }
    function zoomIn() { scale = Math.min(scale+0.2, 3.0); container.innerHTML=''; renderPage(currentPage).then(c=>container.appendChild(c)); }
    function zoomOut() { scale = Math.max(scale-0.2, 0.6); container.innerHTML=''; renderPage(currentPage).then(c=>container.appendChild(c)); }
    loadPDF();
  </script>
</body>
</html>` : `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0"><iframe src="https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}" style="width:100%;height:100vh;border:none"></iframe></body></html>`,
          }}
          style={{ flex: 1, backgroundColor: rt.bg }}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === "progress") setProgress(msg.value);
              if (msg.type === "text" && msg.value) setPageText(msg.value);
            } catch {}
          }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
        />
      ) : (
        // TXT/EPUB → ScrollView con texto
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={(_, h) => setContentHeight(h)}
          onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
          contentContainerStyle={{
            padding: 28,
            paddingBottom: 80,
            maxWidth: 720,
            alignSelf: "center",
            width: "100%",
          }}
        >
          <Text
            style={{
              color: rt.text,
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize * settings.lineHeight,
              fontFamily: settings.fontFamily,
            }}
            selectable
          >
            {content}
          </Text>
        </ScrollView>
      )}

      {/* Barra TTS flotante — visible cuando TTS está activo */}
      {showTTSBar && ttsState !== "idle" && (
        <View style={{
          backgroundColor: settings.theme === "dark" ? "#1f2937" : "#1a1a2e",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.primary + "40",
        }}>
          {/* Progreso TTS arrastrable */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: spacing.xs }}>
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700", minWidth: 28 }}>
              {ttsProgress}%
            </Text>
            <View
              style={{ flex: 1, height: 18, justifyContent: "center" }}
              onLayout={(e) => { ttsBarWidth.current = e.nativeEvent.layout.width; }}
              {...ttsPanResponder.panHandlers}
            >
              <View style={{ height: 6, backgroundColor: "#374151", borderRadius: 3 }}>
                <View style={{ width: `${ttsProgress}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 3 }} />
              </View>
              {/* Thumb arrastrable */}
              <View style={{
                position: "absolute",
                left: `${ttsProgress}%`,
                width: 16, height: 16,
                borderRadius: 8,
                backgroundColor: colors.primary,
                marginLeft: -8,
                top: 1,
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 3,
              }} />
            </View>
            <Text style={{ fontSize: 10, color: "#9CA3AF", minWidth: 40, textAlign: "right" }}>
              {ttsChunkIndex + 1}/{ttsChunks.current.length}
            </Text>
          </View>

          {/* Controles */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

            {/* Velocidad */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 160 }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {TTS_SPEEDS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => ttsSetSpeed(s)}
                    style={{
                      paddingHorizontal: 8, paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: ttsSpeed === s ? colors.primary : "#374151",
                    }}
                  >
                    <Text style={{ fontSize: 11, color: ttsSpeed === s ? "#fff" : "#9CA3AF", fontWeight: "700" }}>
                      {s}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Controles de reproducción */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              {/* Retroceder */}
              <TouchableOpacity onPress={ttsSkipBack} style={{ padding: 6 }}>
                <Text style={{ fontSize: 22 }}>⏮️</Text>
              </TouchableOpacity>

              {/* Play / Pausa */}
              <TouchableOpacity
                onPress={ttsState === "playing" ? ttsPause : ttsPlay}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{ttsState === "playing" ? "⏸" : "▶️"}</Text>
              </TouchableOpacity>

              {/* Avanzar */}
              <TouchableOpacity onPress={ttsSkipForward} style={{ padding: 6 }}>
                <Text style={{ fontSize: 22 }}>⏭️</Text>
              </TouchableOpacity>

              {/* Stop */}
              <TouchableOpacity onPress={ttsStop} style={{ padding: 6 }}>
                <Text style={{ fontSize: 22 }}>⏹️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Barra de progreso inferior — siempre visible */}
      {!loading && !error && (
        <View style={{
          paddingBottom: insets.bottom + 8,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          backgroundColor: rt.bg,
          borderTopWidth: 1,
          borderTopColor: settings.theme === "dark" ? "#374151" : "#E5E7EB",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: settings.theme === "dark" ? "#9CA3AF" : "#6B7280" }}>
              {ttsState === "playing" ? "🔊 Leyendo..." : ttsState === "paused" ? "⏸️ Pausado" : (book?.title ?? "")}
            </Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>{progress}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: settings.theme === "dark" ? "#374151" : "#E5E7EB", borderRadius: 2 }}>
            <View style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 2 }} />
          </View>
        </View>
      )}

      {/* Modal configuración */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{
            backgroundColor: colors.backgroundCard,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.lg }} />

            <Text style={{ fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xl }}>
              Configuración de lectura
            </Text>

            {/* Tema */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Tema de pantalla
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl }}>
              {(Object.entries(READER_THEMES) as [keyof typeof READER_THEMES, any][]).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateSettings({ theme: key })}
                  style={{
                    flex: 1, padding: spacing.md,
                    borderRadius: borderRadius.xl,
                    backgroundColor: val.bg,
                    borderWidth: 2.5,
                    borderColor: settings.theme === key ? colors.primary : colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: val.text, fontSize: typography.fontSizes.sm, fontWeight: "700" }}>
                    {val.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tamaño fuente */}
            <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
              Tamaño de letra: <Text style={{ color: colors.primary }}>{settings.fontSize}px</Text>
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.xl }}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => updateSettings({ fontSize: size })}
                  style={{
                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                    borderRadius: borderRadius.lg,
                    backgroundColor: settings.fontSize === size ? colors.primary : colors.surface,
                    minWidth: 52, alignItems: "center",
                  }}
                >
                  <Text style={{ color: settings.fontSize === size ? colors.textInverse : colors.textSecondary, fontSize: size * 0.7, fontWeight: "700" }}>A</Text>
                  <Text style={{ color: settings.fontSize === size ? colors.textInverse : colors.textTertiary, fontSize: 10 }}>{size}px</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TTS */}
            <TouchableOpacity
              onPress={() => { setShowSettings(false); setTimeout(ttsState === "playing" ? ttsPause : ttsPlay, 300); }}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                backgroundColor: ttsState === "playing" ? colors.error : colors.primary,
                padding: spacing.md, borderRadius: borderRadius.xl,
                marginBottom: spacing.sm, gap: spacing.sm,
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {ttsState === "playing" ? "⏸️" : ttsState === "paused" ? "▶️" : "🔊"}
              </Text>
              <Text style={{ color: colors.textInverse, fontWeight: "700", fontSize: typography.fontSizes.base }}>
                {ttsState === "playing" ? "Pausar lectura" : ttsState === "paused" ? "Reanudar lectura" : "Leer en voz alta"}
              </Text>
            </TouchableOpacity>

            {/* Selector de voz */}
            {availableVoices.length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: "600" }}>
                  Voz para lectura en voz alta
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {/* Opción por defecto */}
                  <TouchableOpacity
                    onPress={() => setSelectedVoice(undefined)}
                    style={{
                      paddingHorizontal: spacing.sm, paddingVertical: 6,
                      borderRadius: borderRadius.lg,
                      backgroundColor: !selectedVoice ? colors.primary : colors.surface,
                      marginRight: spacing.xs, borderWidth: 1,
                      borderColor: !selectedVoice ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: typography.fontSizes.xs, color: !selectedVoice ? colors.textInverse : colors.textSecondary, fontWeight: "600" }}>
                      🔊 Por defecto
                    </Text>
                  </TouchableOpacity>
                  {availableVoices.map((voice) => (
                    <TouchableOpacity
                      key={voice.identifier}
                      onPress={() => setSelectedVoice(voice.identifier)}
                      style={{
                        paddingHorizontal: spacing.sm, paddingVertical: 6,
                        borderRadius: borderRadius.lg,
                        backgroundColor: selectedVoice === voice.identifier ? colors.primary : colors.surface,
                        marginRight: spacing.xs, borderWidth: 1,
                        borderColor: selectedVoice === voice.identifier ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: typography.fontSizes.xs, color: selectedVoice === voice.identifier ? colors.textInverse : colors.textSecondary, fontWeight: "600" }}>
                        {voice.name ?? voice.identifier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>
                  Para más voces: Ajustes → Accesibilidad → Texto a voz
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={() => setShowSettings(false)} style={{ padding: spacing.md, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.base }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
