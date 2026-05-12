import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { useSections } from "../../hooks/useSections";
import { useUploadBook } from "../../hooks/useBooks";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { BookFormat } from "../../types";

const FORMATS: { label: string; value: BookFormat; mime: string[] }[] = [
  { label: "PDF",  value: "pdf",  mime: ["application/pdf"] },
  { label: "EPUB", value: "epub", mime: ["application/epub+zip"] },
  { label: "TXT",  value: "txt",  mime: ["text/plain"] },
  { label: "MP3",  value: "mp3",  mime: ["audio/mpeg"] },
  { label: "M4B",  value: "m4b",  mime: ["audio/mp4", "audio/x-m4b"] },
];

export function UploadBookScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const { data: sections } = useSections();
  const uploadBook = useUploadBook();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [format, setFormat] = useState<BookFormat>("pdf");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<any>(null);
  const [bookFile, setBookFile] = useState<any>(null);
  const [audioFile, setAudioFile] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [2, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCoverFile({
        uri: asset.uri,
        name: `cover.${asset.uri.split(".").pop()}`,
        type: asset.mimeType ?? "image/jpeg",
      });
    }
  }

  async function pickBookFile() {
    const selectedFormat = FORMATS.find((f) => f.value === format);
    const result = await DocumentPicker.getDocumentAsync({
      type: selectedFormat?.mime ?? ["*/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setBookFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
        size: asset.size,
      });
    }
  }

  async function pickAudioFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/mpeg", "audio/mp4", "audio/x-m4b"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAudioFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "audio/mpeg",
        size: asset.size,
      });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "El título es requerido";
    if (!author.trim()) e.author = "El autor es requerido";
    if (!sectionId) e.section = "Seleccioná una sección";
    if (!bookFile) e.bookFile = "Seleccioná el archivo del libro";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleUpload() {
    if (!validate()) return;

    try {
      await uploadBook.mutateAsync({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
        sectionId,
        format,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        coverFile,
        bookFile,
        audioFile,
      });

      Alert.alert("¡Listo!", "El libro fue subido correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "No se pudo subir el libro");
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          fontSize: typography.fontSizes.xxl,
          fontWeight: typography.fontWeights.bold,
          color: colors.textPrimary,
          marginBottom: spacing.xl,
        }}
      >
        Subir libro
      </Text>

      {/* Portada */}
      <TouchableOpacity
        onPress={pickCover}
        style={{
          alignSelf: "center",
          width: 120,
          height: 180,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: colors.border,
          borderStyle: "dashed",
        }}
      >
        {coverFile ? (
          <Image source={{ uri: coverFile.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: spacing.xs }}>🖼️</Text>
            <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary, textAlign: "center" }}>
              Portada
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Input label="Título *" placeholder="El nombre del libro" value={title} onChangeText={setTitle} error={errors.title} />
      <Input label="Autor *" placeholder="Nombre del autor" value={author} onChangeText={setAuthor} error={errors.author} />
      <Input
        label="Descripción"
        placeholder="Breve descripción del libro"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: "top" }}
      />

      {/* Sección */}
      <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.textSecondary, marginBottom: spacing.xs }}>
        Sección *
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {(sections ?? []).map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setSectionId(s.id)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
              backgroundColor: sectionId === s.id ? colors.primary : colors.surface,
              marginRight: spacing.sm,
              borderWidth: 1.5,
              borderColor: sectionId === s.id ? colors.primary : "transparent",
            }}
          >
            <Text style={{ color: sectionId === s.id ? colors.textInverse : colors.textSecondary, fontSize: typography.fontSizes.sm }}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.section && <Text style={{ color: colors.error, fontSize: typography.fontSizes.xs, marginBottom: spacing.md }}>{errors.section}</Text>}

      {/* Formato */}
      <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.textSecondary, marginBottom: spacing.xs }}>
        Formato *
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }}>
        {FORMATS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFormat(f.value)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
              backgroundColor: format === f.value ? colors.primary : colors.surface,
            }}
          >
            <Text style={{ color: format === f.value ? colors.textInverse : colors.textSecondary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Archivo del libro */}
      <TouchableOpacity
        onPress={pickBookFile}
        style={{
          backgroundColor: colors.backgroundCard,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 1.5,
          borderColor: errors.bookFile ? colors.error : bookFile ? colors.primary : colors.border,
          borderStyle: bookFile ? "solid" : "dashed",
          marginBottom: spacing.md,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, marginRight: spacing.sm }}>📄</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.textPrimary }}>
            {bookFile ? bookFile.name : `Seleccionar archivo ${format.toUpperCase()}`}
          </Text>
          {bookFile?.size && (
            <Text style={{ fontSize: typography.fontSizes.xs, color: colors.textSecondary }}>
              {(bookFile.size / 1024 / 1024).toFixed(1)} MB
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {errors.bookFile && <Text style={{ color: colors.error, fontSize: typography.fontSizes.xs, marginBottom: spacing.md }}>{errors.bookFile}</Text>}

      {/* Audio opcional */}
      <TouchableOpacity
        onPress={pickAudioFile}
        style={{
          backgroundColor: colors.backgroundCard,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          borderWidth: 1.5,
          borderColor: audioFile ? colors.primary : colors.border,
          borderStyle: audioFile ? "solid" : "dashed",
          marginBottom: spacing.md,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, marginRight: spacing.sm }}>🎧</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, color: colors.textPrimary }}>
            {audioFile ? audioFile.name : "Agregar audiolibro (opcional)"}
          </Text>
        </View>
        {audioFile && (
          <TouchableOpacity onPress={() => setAudioFile(null)}>
            <Text style={{ color: colors.error }}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Input
        label="Tags (separados por coma)"
        placeholder="ficción, aventura, clásico"
        value={tags}
        onChangeText={setTags}
      />

      <Button
        title="Subir libro"
        onPress={handleUpload}
        loading={uploadBook.isPending}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}
