import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { generateDesign, generateShopping } from "../services/api";

const STYLES = [
  { key: "modern", label: "מודרני", emoji: "🏙️" },
  { key: "minimalist", label: "מינימליסטי", emoji: "⬜" },
  { key: "rustic", label: "כפרי", emoji: "🪵" },
  { key: "scandinavian", label: "סקנדינבי", emoji: "🌿" },
  { key: "mediterranean", label: "ים תיכוני", emoji: "🫒" },
  { key: "luxury", label: "יוקרה", emoji: "👑" },
];

const ROOM_TYPES = [
  { key: "living_room", label: "סלון" },
  { key: "bedroom", label: "חדר שינה" },
  { key: "kitchen", label: "מטבח" },
  { key: "garden", label: "גינה" },
  { key: "balcony", label: "מרפסת" },
  { key: "office", label: "חדר עבודה" },
];

const BUDGETS = [2000, 5000, 10000, 20000, 50000];

type LoadingStep = null | "analyzing" | "generating" | "shopping";

const STEP_TEXT: Record<string, string> = {
  analyzing: "🔍 מנתח את החדר...",
  generating: "🎨 יוצר עיצוב עם AI...",
  shopping: "🛍️ בונה רשימת קנייה...",
};

export default function HomeScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<{ uri: string; base64?: string | null } | null>(null);
  const [style, setStyle] = useState("modern");
  const [roomType, setRoomType] = useState("living_room");
  const [budget, setBudget] = useState(10000);
  const [loading, setLoading] = useState<LoadingStep>(null);

  async function pickPhoto(useCamera: boolean) {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  }

  async function handleGenerate() {
    if (!photo?.base64) return;
    try {
      setLoading("analyzing");
      const design = await generateDesign(photo.base64, roomType, style, budget);

      setLoading("shopping");
      const shopping = await generateShopping(design.design_brief, roomType, style, budget);

      setLoading(null);
      router.push({
        pathname: "/result",
        params: {
          designJson: JSON.stringify(design),
          shoppingJson: JSON.stringify(shopping),
          originalUri: photo.uri,
        },
      });
    } catch (e: any) {
      setLoading(null);
      Alert.alert("שגיאה", e?.response?.data?.detail ?? "אירעה שגיאה, נסה שנית");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo picker */}
      <Text style={styles.sectionTitle}>📸 תמונת החדר</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(false)}>
          <Text style={styles.photoBtnText}>גלריה 🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto(true)}>
          <Text style={styles.photoBtnText}>מצלמה 📷</Text>
        </TouchableOpacity>
      </View>
      {photo && (
        <Image source={{ uri: photo.uri }} style={styles.previewImage} resizeMode="cover" />
      )}

      {/* Room type */}
      <Text style={styles.sectionTitle}>🏠 סוג המרחב</Text>
      <View style={styles.grid}>
        {ROOM_TYPES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.chip, roomType === r.key && styles.chipSelected]}
            onPress={() => setRoomType(r.key)}
          >
            <Text style={[styles.chipText, roomType === r.key && styles.chipTextSelected]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Style */}
      <Text style={styles.sectionTitle}>🎨 סגנון עיצוב</Text>
      <View style={styles.grid}>
        {STYLES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.styleChip, style === s.key && styles.chipSelected]}
            onPress={() => setStyle(s.key)}
          >
            <Text style={styles.styleEmoji}>{s.emoji}</Text>
            <Text style={[styles.chipText, style === s.key && styles.chipTextSelected]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Budget */}
      <Text style={styles.sectionTitle}>💰 תקציב</Text>
      <View style={styles.budgetRow}>
        {BUDGETS.map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.budgetChip, budget === b && styles.chipSelected]}
            onPress={() => setBudget(b)}
          >
            <Text style={[styles.budgetText, budget === b && styles.chipTextSelected]}>
              ₪{b.toLocaleString("he-IL")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.generateBtn, (!photo || loading !== null) && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={!photo || loading !== null}
      >
        <Text style={styles.generateBtnText}>
          {loading ? STEP_TEXT[loading] : "✨ צור עיצוב"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginTop: 24, marginBottom: 12, textAlign: "right" },
  photoRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  photoBtn: { flex: 1, backgroundColor: "#0284c7", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  photoBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  previewImage: { width: "100%", height: 220, borderRadius: 16, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  styleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  styleEmoji: { fontSize: 18 },
  chipSelected: { borderColor: "#0284c7", backgroundColor: "#e0f2fe" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  chipTextSelected: { color: "#0369a1" },
  budgetRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  budgetChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  budgetText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  generateBtn: { marginTop: 28, backgroundColor: "#0284c7", borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#0284c7", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  generateBtnDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0 },
  generateBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
