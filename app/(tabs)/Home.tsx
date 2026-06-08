import { useAuth } from "@/lib/authContext";
import { deleteTransaction, getTransactions } from "@/lib/db";
import { useNetwork } from "@/lib/networkContext";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Background from "../components/Background";
import ConfirmationModal from "../components/ConfirmationModal";
import Screen from "../components/Screen";
import Transaction from "../components/Transaction";
import TransactionDetailsModal from "../components/TransactionDetailsModal";

function Home() {
  const router = useRouter();
  const { userId, isLoggedIn, isGuest } = useAuth();
  const { isOnline } = useNetwork();

  const [selectedFilter, setSelectedFilter] = useState("TODAY");
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadItems = useCallback(
    async (filterType: string = "TODAY", ascending: boolean = false) => {
      const rows = await getTransactions(
        userId,
        isGuest,
        filterType,
        ascending,
      );
      return rows;
    },
    [userId, isGuest],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const rows = await loadItems(selectedFilter, sortAscending);
    setItems(rows);
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    const transactionToDelete = items.find((i) => i.local_id === itemToDelete);

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

        if (error) console.warn("[home] Remote delete failed:", error.message);
      } catch (e) {
        console.warn("[home] Remote delete error:", e);
      }
    }

    await deleteTransaction(itemToDelete);
    const rows = await loadItems(selectedFilter, sortAscending);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems(rows);
    setRefreshTrigger((prev) => prev + 1);
    setItemToDelete(null);
  };

  const handleEdit = (item: any) => {
    // For now, just show an alert or navigate to a hypothetical edit screen
    Alert.alert("Edit", `Edit feature for ${item.title} coming soon!`);
  };

  // Initial load
  useEffect(() => {
    loadItems(selectedFilter, sortAscending).then((rows) => {
      setItems(rows);
      setRefreshTrigger((prev) => prev + 1);
    });
  }, [userId, selectedFilter, sortAscending]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadItems(selectedFilter, sortAscending).then((rows) => {
        setItems(rows);
        setRefreshTrigger((prev) => prev + 1);
      });
    }, [userId, isGuest, selectedFilter, sortAscending]),
  );

  return (
    <Background>
      <SafeAreaProvider style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} enabled>
          <View style={styles.container}>
            <View style={styles.titleRow}>
              <View></View>
              <Text style={styles.title}>- EXPENCE -</Text>
              {/* Network status dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? "#4ade80" : "#f87171" },
                ]}
              />
            </View>

            <Screen
              userId={userId}
              isGuest={isGuest}
              sortAscending={sortAscending}
              onFilterChange={setSelectedFilter}
              refreshTrigger={refreshTrigger}
            />

            {/* Guest mode banner */}
            {isGuest && (
              <Pressable
                style={styles.guestBanner}
                onPress={() => router.push("/auth/Login")}
              >
                <Text style={styles.guestBannerText}>
                  👻 Guest mode — TAP TO LOGIN & SYNC
                </Text>
              </Pressable>
            )}

            <View style={styles.transactionsContainer}>
              <View style={styles.transactionsHeader}>
                <Pressable onPress={() => setSortAscending(!sortAscending)}>
                  <Text style={styles.transactionsHeaderTitle}>
                    Transactions {sortAscending ? "🔼" : "🔽"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/Transactions")}>
                  <Text style={styles.transactionsHeaderViewAll}>View All</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                style={styles.transactionsList}
                scrollEnabled={!refreshing}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="white"
                  />
                }
              >
                {items.length === 0 ? (
                  <Text style={styles.emptyText}>No transactions yet</Text>
                ) : (
                  items.map((item) => (
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
          </View>
        </KeyboardAvoidingView>

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
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: "13%",
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 250,
    maxWidth: 400,
    alignSelf: "center",
  },
  titleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
    gap: 8,
  },
  title: {
    textAlign: "center",
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 15,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  guestBanner: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  guestBannerText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  transactionsContainer: {
    width: "100%",
    minHeight: 450,
  },
  transactionsHeader: {
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    width: "100%",
    minWidth: 250,
    maxWidth: 300,
  },
  transactionsHeaderTitle: {
    fontFamily: "VCR-Mono",
    fontSize: 13,
    color: "white",
  },
  transactionsHeaderViewAll: {
    fontFamily: "VCR-Mono",
    fontSize: 13,
    color: "white",
  },
  transactionsList: {
    flexDirection: "column",
    width: "100%",
    maxHeight: 500,
    minWidth: 250,
  },
  emptyText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 32,
  },
  bottomPaddingIOS: {
    height: 290,
  },
  bottomPaddingAndroid: {
    paddingBottom: 100,
  },
});

export default Home;
