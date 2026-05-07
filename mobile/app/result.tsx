import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DesignResult, ShoppingResult } from "../services/api";

const PRIORITY_LABEL: Record<string, string> = {
  essential: "חובה",
  recommended: "מומלץ",
  optional: "אופציונלי",
};

const PRIORITY_COLOR: Record<string, string> = {
  essential: "#fee2e2",
  recommended: "#fef3c7",
  optional: "#dcfce7",
};

const PRIORITY_TEXT_COLOR: Record<string, string> = {
  essential: "#b91c1c",
  recommended: "#92400e",
  optional: "#166534",
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    designJson: string;
    shoppingJson: string;
    originalUri: string;
  }>();

  const design: DesignResult = JSON.parse(params.designJson ?? "{}");
  const shopping: ShoppingResult = JSON.parse(params.shoppingJson ?? "{}");

  const totalEssential = shopping.total_essential ?? 0;
  const totalAll = totalEssential + (shopping.total_recommended ?? 0) + (shopping.total_optional ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.title}>{design.room_label} — {design.style_label}</Text>
      <Text style={styles.analysis}>{design.analysis}</Text>

      {/* Before / After */}
      <View style={styles.imagesRow}>
        <View style={styles.imageBox}>
          <Text style={styles.imageLabel}>לפני</Text>
          <Image source={{ uri: params.originalUri }} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.imageBox}>
          <Text style={[styles.imageLabel, { color: "#0284c7" }]}>אחרי ✨</Text>
          <Image source={{ uri: design.redesign_image_url }} style={styles.image} resizeMode="cover" />
        </View>
      </View>

      {/* Budget */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💰 סיכום תקציב</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>תקציב:</Text>
          <Text style={styles.budgetValue}>₪{shopping.budget_nis?.toLocaleString("he-IL")}</Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>פריטי חובה:</Text>
          <Text style={[styles.budgetValue, { color: "#b91c1c" }]}>₪{totalEssential.toLocaleString("he-IL")}</Text>
        </View>
        <Text style={[styles.withinBudget, { color: shopping.within_budget ? "#0284c7" : "#b91c1c" }]}>
          {shopping.within_budget ? "✓ פריטי החובה בתקציב" : "⚠️ חריגה מהתקציב"}
        </Text>
      </View>

      {/* Shopping list */}
      <Text style={styles.sectionTitle}>🛍️ רשימת קנייה</Text>
      {shopping.items?.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[item.priority] }]}>
              <Text style={[styles.priorityText, { color: PRIORITY_TEXT_COLOR[item.priority] }]}>
                {PRIORITY_LABEL[item.priority]}
              </Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>{item.description}</Text>
          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>₪{item.estimated_price_nis.toLocaleString("he-IL")}</Text>
          </View>
          <View style={styles.linksRow}>
            <TouchableOpacity style={styles.storeBtn} onPress={() => Linking.openURL(item.store_url)}>
              <Text style={styles.storeBtnText}>🛒 {item.store}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.compareBtn} onPress={() => Linking.openURL(item.google_shopping_url)}>
              <Text style={styles.compareBtnText}>🔍 השוואת מחירים</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← עיצוב חדש</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", textAlign: "right", marginBottom: 8 },
  analysis: { fontSize: 14, color: "#64748b", textAlign: "right", marginBottom: 20, lineHeight: 22 },
  imagesRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  imageBox: { flex: 1 },
  imageLabel: { fontWeight: "700", fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 6 },
  image: { width: "100%", height: 160, borderRadius: 14 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", textAlign: "right", marginBottom: 12, marginTop: 4 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  budgetLabel: { fontSize: 14, color: "#64748b" },
  budgetValue: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  withinBudget: { marginTop: 8, fontWeight: "600", fontSize: 14, textAlign: "right" },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1, textAlign: "right" },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginRight: 8 },
  priorityText: { fontSize: 12, fontWeight: "700" },
  itemDesc: { fontSize: 13, color: "#64748b", textAlign: "right", lineHeight: 20, marginBottom: 10 },
  itemFooter: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 },
  itemPrice: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  linksRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  storeBtn: { backgroundColor: "#e0f2fe", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#bae6fd" },
  storeBtnText: { color: "#0369a1", fontWeight: "700", fontSize: 12 },
  compareBtn: { backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#e2e8f0" },
  compareBtnText: { color: "#475569", fontWeight: "700", fontSize: 12 },
  backBtn: { marginTop: 20, backgroundColor: "#0284c7", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
