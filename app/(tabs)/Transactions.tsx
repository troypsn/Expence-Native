import { useAuth } from "@/lib/authContext";
import { deleteTransaction, getDb } from "@/lib/db";
import { useNetwork } from "@/lib/networkContext";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Background from "../components/Background";
import ConfirmationModal from "../components/ConfirmationModal";
import Transaction from "../components/Transaction";
import TransactionDetailsModal from "../components/TransactionDetailsModal";

type LocalTransaction = {
  local_id: number;
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
  synced: number;
  is_guest: number;
};

type Preset =
  | "ALL"
  | "TODAY"
  | "THIS WEEK"
  | "THIS MONTH"
  | "THIS YEAR"
  | "CUSTOM";

// ─── Helpers ───
const parseDate = (d: string) => {
  const parts = d.split("-");
  if (parts.length !== 3) return null;
  const date = new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2]),
  );
  return isNaN(date.getTime()) ? null : date;
};

const getPresetRange = (
  p: Preset,
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (p === "TODAY") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (p === "THIS WEEK") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (p === "THIS MONTH") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (p === "THIS YEAR") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    return { start: null, end: null };
  }
  return { start, end };
};

export default function Transactions() {
  const { userId, isGuest, isLoggedIn } = useAuth();
  const { isOnline } = useNetwork();

  const [allItems, setAllItems] = useState<LocalTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<LocalTransaction | null>(null);

  // Date filter
  const [preset, setPreset] = useState<Preset>("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Load everything from SQLite
  const loadAll = useCallback(async () => {
    const db = await getDb();
    const whereClause = isGuest
      ? `WHERE is_guest = 1`
      : `WHERE user_id = ? AND is_guest = 0`;
    const params: any[] = isGuest ? [] : [userId];
    const order = sortAscending ? "ASC" : "DESC";
    const rows = await db.getAllAsync<LocalTransaction>(
      `SELECT * FROM transactions ${whereClause} ORDER BY created_at ${order}`,
      params,
    );
    setAllItems(rows);
  }, [userId, isGuest, sortAscending]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    const transactionToDelete = allItems.find(
      (i) => i.local_id === itemToDelete,
    );

    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    // ─── Remote Deletion ───
    if (isLoggedIn && isOnline && transactionToDelete?.remote_id) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("transaction_id", transactionToDelete.remote_id);

        if (error)
          console.warn("[transactions] Remote delete failed:", error.message);
      } catch (e) {
        console.warn("[transactions] Remote delete error:", e);
      }
    }

    await deleteTransaction(itemToDelete);
    await loadAll();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItemToDelete(null);
  };

  const handleEdit = (item: any) => {
    Alert.alert("Edit", `Edit feature for ${item.title} coming soon!`);
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );
  // ... existing filter logic ...

  const filtered = allItems.filter((item) => {
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.description?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    // Date preset / custom
    if (preset === "CUSTOM") {
      const start = parseDate(customStart);
      const end = parseDate(customEnd);
      const created = new Date(item.created_at);
      if (start && created < start) return false;
      const endOfDay = end ? new Date(end.getTime()) : null;
      if (endOfDay) {
        endOfDay.setUTCHours(23, 59, 59, 999);
      }
      if (endOfDay && created > endOfDay) return false;
    } else if (preset !== "ALL") {
      const { start, end } = getPresetRange(preset);
      const created = new Date(item.created_at);
      if (start && created < start) return false;
      if (end && created > end) return false;
    }

    return true;
  });

  const totalFiltered = filtered.reduce((sum, i) => sum + i.amount, 0);

  const PRESETS: Preset[] = [
    "ALL",
    "TODAY",
    "THIS WEEK",
    "THIS MONTH",
    "THIS YEAR",
    "CUSTOM",
  ];

  return (
    <Background>
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>- TRANSACTIONS -</Text>

          {/* ── Search bar ── */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search title or description..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* ── Date presets ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetScroll}
            contentContainerStyle={styles.presetContent}
          >
            {PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  if (p === "CUSTOM") {
                    setShowCustomModal(true);
                  } else {
                    setPreset(p);
                    setCustomStart("");
                    setCustomEnd("");
                  }
                }}
                style={[
                  styles.presetChip,
                  preset === p && styles.presetChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    preset === p && styles.presetChipTextActive,
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Custom date range label */}
          {preset === "CUSTOM" && (customStart || customEnd) && (
            <Text style={styles.customRangeLabel}>
              {customStart || "..."} → {customEnd || "..."}
            </Text>
          )}

          {/* ── Summary row ── */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryCount}>{filtered.length} records</Text>
            <Pressable
              onPress={() => setSortAscending(!sortAscending)}
              style={styles.sortBtn}
            >
              <Text style={styles.sortBtnText}>
                {sortAscending ? "🔼 Oldest" : "🔽 Newest"}
              </Text>
            </Pressable>
            <Text style={styles.summaryTotal}>
              ${Math.round(totalFiltered)}
            </Text>
          </View>

          {/* ── Transaction list ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
              />
            }
          >
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No transactions found</Text>
            ) : (
              filtered.map((item) => (
                <Transaction
                  key={item.local_id}
                  name={item.title}
                  amount={item.amount}
                  date={item.created_at}
                  image={item.image}
                  onPress={() => setSelectedTransaction(item)}
                  onDelete={() => setItemToDelete(item.local_id)}
                  onEdit={() => handleEdit(item)}
                />
              ))
            )}
            <View
              style={
                Platform.OS === "ios"
                  ? styles.bottomPaddingIOS
                  : styles.bottomPaddingAndroid
              }
            />
          </ScrollView>
        </View>

        <ConfirmationModal
          visible={itemToDelete !== null}
          title="DELETE TRANSACTION?"
          body="Are you sure you want to delete this transaction?"
          confirmText="DELETE"
          onConfirm={confirmDelete}
          onCancel={() => setItemToDelete(null)}
          danger
        />

        <TransactionDetailsModal
          visible={selectedTransaction !== null}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
      </SafeAreaProvider>

      {/* ── Custom Date Modal ── */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CUSTOM DATE RANGE</Text>
            <Text style={styles.modalLabel}>FROM (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2026-01-01"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={customStart}
              onChangeText={setCustomStart}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.modalLabel}>TO (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="2026-12-31"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={customEnd}
              onChangeText={setCustomEnd}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalApply}
                onPress={() => {
                  setPreset("CUSTOM");
                  setShowCustomModal(false);
                }}
              >
                <Text style={styles.modalApplyText}>APPLY</Text>
              </Pressable>
              <Pressable
                style={styles.modalCancel}
                onPress={() => {
                  setShowCustomModal(false);
                  if (preset === "CUSTOM") setPreset("ALL");
                }}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: "13%",
    flex: 1,
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 15,
    marginBottom: 16,
  },

  // ── Search ──
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  searchInput: {
    flex: 1,
    fontFamily: "VCR-Mono",
    color: "white",
    height: 42,
    fontSize: 12,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },

  // ── Preset chips ──
  presetScroll: {
    maxHeight: 40,
    width: "100%",
  },
  presetContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  presetChipActive: {
    backgroundColor: "white",
    borderColor: "white",
  },
  presetChipText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  presetChipTextActive: {
    color: "#0f0f2e",
  },
  customRangeLabel: {
    marginTop: 6,
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
  },

  // ── Summary ──
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 10,
    marginBottom: 6,
  },
  summaryCount: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  sortBtnText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  summaryTotal: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 14,
  },

  // ── List ──
  list: {
    width: "100%",
    flex: 1,
  },
  emptyText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
  },
  bottomPaddingIOS: { height: 120 },
  bottomPaddingAndroid: { paddingBottom: 100 },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#1d1d36",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  modalTitle: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalLabel: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginBottom: 6,
  },
  modalInput: {
    fontFamily: "VCR-Mono",
    color: "white",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalApply: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalApplyText: {
    fontFamily: "VCR-Mono",
    color: "#0f0f2e",
    fontSize: 13,
  },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
});
