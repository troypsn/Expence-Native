import { useAuth } from "@/lib/authContext";
import {
  getDb,
  updateTransaction,
  updateShortcut,
} from "@/lib/db";
import { useNetwork } from "@/lib/networkContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "./Background";

const car = require("@/assets/images/car.png");
const food = require("@/assets/images/food.png");
const money = require("@/assets/images/money.png");

let ImagePicker: any;

export default function EditTransaction() {
  const router = useRouter();
  const { local_id, type } = useLocalSearchParams<{
    local_id: string;
    type: "expense" | "shortcut";
  }>();
  const { isLoggedIn, userId } = useAuth();
  const { isOnline } = useNetwork();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [icon, setIcon] = useState("money");
  const [details, setDetails] = useState({
    title: "",
    amount: "",
    description: "",
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [requirePhoto, setRequirePhoto] = useState(false);

  // ─── Load existing record ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!local_id) return;
      try {
        const db = await getDb();
        const table = type === "shortcut" ? "shortcuts" : "transactions";
        const row = await db.getFirstAsync<any>(
          `SELECT * FROM ${table} WHERE local_id = ?`,
          [parseInt(local_id)],
        );
        if (!row) {
          Alert.alert("Error", "Record not found.");
          router.back();
          return;
        }

        // Detect if image is a local file or icon name
        const isLocalOrRemote =
          row.image &&
          (row.image.startsWith("file://") ||
            row.image.startsWith("content://") ||
            row.image.startsWith("http") ||
            row.image.startsWith("data:"));

        if (isLocalOrRemote) {
          setPhotoUri(row.image);
          setIcon("money"); // fallback icon
        } else {
          setIcon(row.image ?? "money");
          setPhotoUri(null);
        }

        setDetails({
          title: row.title ?? "",
          amount: row.amount != null ? String(row.amount) : "",
          description: row.description ?? "",
        });
        setRequirePhoto(row.require_photo === 1);
      } catch (e) {
        Alert.alert("Error", "Failed to load record.");
        router.back();
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [local_id, type]);

  // ─── Photo picker ─────────────────────────────────────────────────────────
  async function pickImage(fromCamera: boolean) {
    try {
      if (!ImagePicker) {
        const module = await import("expo-image-picker");
        ImagePicker = module;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.4,
        })
        : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.4,
        });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to access camera or photos.");
    }
  }

  function openPhotoPicker() {
    Alert.alert("Change Photo", "Choose a photo source.", [
      { text: "Take Photo", onPress: () => pickImage(true) },
      { text: "Upload Photo", onPress: () => pickImage(false) },
      { text: "Remove Photo", onPress: () => setPhotoUri(null), style: "destructive" },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (loading) return;
    const { title, amount, description } = details;

    if (!title.trim() || !amount.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const selectedImage = photoUri ?? icon;
      const parsedId = parseInt(local_id!);

      const updates: Record<string, any> = {
        title: title.trim(),
        amount: parseFloat(amount),
        image: selectedImage,
        description: description.trim(),
        synced: 0,
      };

      if (type === "shortcut") {
        updates.require_photo = requirePhoto ? 1 : 0;
        await updateShortcut(parsedId, updates);
      } else {
        await updateTransaction(parsedId, updates);
      }

      // ─── Background sync ───
      if (isLoggedIn && isOnline && userId) {
        (async () => {
          try {
            const { syncPendingData } = await import("@/lib/sync");
            await syncPendingData(userId);
          } catch (e) {
            console.warn("[edit] Background sync failed:", e);
          }
        })();
      }

      Alert.alert(
        "Saved",
        `${type === "shortcut" ? "Shortcut" : "Transaction"} updated!`,
      );
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <Background>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="white" size="large" />
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ─── Header ─── */}
            <View style={styles.headerContainer}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <FontAwesome5 name="arrow-left" size={16} color="white" />
              </Pressable>
              <Text style={styles.title}>
                Edit {type === "shortcut" ? "Shortcut" : "Expense"}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {/* ─── Icon Picker ─── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Icon</Text>
              <View style={styles.pickIcon}>
                <Pressable
                  onPress={() => { setIcon("money"); setPhotoUri(null); }}
                  style={styles.iconContainer}
                >
                  <Image
                    source={money}
                    style={[styles.icon, icon === "money" && !photoUri && styles.selectedIcon]}
                  />
                </Pressable>
                <Pressable
                  onPress={() => { setIcon("car"); setPhotoUri(null); }}
                  style={styles.iconContainer}
                >
                  <Image
                    source={car}
                    style={[styles.icon, icon === "car" && !photoUri && styles.selectedIcon]}
                  />
                </Pressable>
                <Pressable
                  onPress={() => { setIcon("food"); setPhotoUri(null); }}
                  style={styles.iconContainer}
                >
                  <Image
                    source={food}
                    style={[styles.icon, icon === "food" && !photoUri && styles.selectedIcon]}
                  />
                </Pressable>
              </View>
            </View>

            {/* ─── Title ─── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                placeholder="Enter Title"
                placeholderTextColor="gray"
                style={styles.textInput}
                value={details.title}
                onChangeText={(t) => setDetails({ ...details, title: t })}
              />
            </View>

            {/* ─── Amount ─── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                placeholder="Enter Amount"
                placeholderTextColor="gray"
                style={styles.textInput}
                keyboardType="numeric"
                value={details.amount}
                onChangeText={(t) => setDetails({ ...details, amount: t })}
              />
            </View>

            {/* ─── Description ─── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter Description"
                placeholderTextColor="gray"
                style={styles.textInputDescription}
                multiline
                textAlignVertical="top"
                value={details.description}
                onChangeText={(t) => setDetails({ ...details, description: t })}
              />
            </View>

            {/* ─── Photo ─── */}
            <View style={styles.inputContainer}>
              <Pressable style={styles.photoButton} onPress={openPhotoPicker}>
                <Text style={styles.photoButtonText}>
                  {photoUri ? "Change Photo" : "Add / Change Photo"}
                </Text>
              </Pressable>
              {photoUri && (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    style={styles.photoRemoveButton}
                  >
                    <Text style={styles.photoRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ─── Require Photo (Shortcuts only) ─── */}
            {type === "shortcut" && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Require Photo on Use</Text>
                <Pressable
                  style={[
                    styles.toggleButton,
                    requirePhoto && styles.toggleButtonActive,
                  ]}
                  onPress={() => setRequirePhoto(!requirePhoto)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      requirePhoto && styles.toggleButtonTextActive,
                    ]}
                  >
                    {requirePhoto ? "Yes, require photo" : "No, optional photo"}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ─── Save Button ─── */}
            <Pressable
              style={[styles.saveButton, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
    paddingTop: 50,
  },
  headerContainer: {
    width: "70%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 22,
  },
  inputContainer: {
    padding: 5,
    alignItems: "flex-start",
    justifyContent: "center",
    width: "70%",
    marginBottom: 16,
  },
  label: {
    fontFamily: "VCR-Mono",
    color: "white",
    marginBottom: 4,
  },
  pickIcon: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  icon: {
    width: 40,
    height: 40,
    margin: 10,
  },
  selectedIcon: {
    borderColor: "white",
    borderWidth: 1.5,
  },
  textInput: {
    fontFamily: "VCR-Mono",
    color: "white",
    width: "100%",
    height: 45,
    borderWidth: 1.5,
    marginTop: 8,
    borderColor: "white",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  textInputDescription: {
    padding: 5,
    height: 100,
    marginBottom: 16,
    fontFamily: "VCR-Mono",
    borderWidth: 1.5,
    borderColor: "white",
    borderRadius: 10,
    color: "white",
    minWidth: "100%",
    overflow: "hidden",
  },
  photoButton: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  photoButtonText: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 12,
  },
  photoPreviewContainer: {
    marginTop: 10,
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  photoPreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    resizeMode: "cover",
  },
  photoRemoveButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  photoRemoveText: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 12,
  },
  toggleButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: "100%",
  },
  toggleButtonActive: {
    backgroundColor: "white",
    borderColor: "white",
  },
  toggleButtonText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  toggleButtonTextActive: {
    color: "#0f0f2e",
  },
  saveButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    width: "67%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  saveButtonText: {
    fontFamily: "VCR-Mono",
    color: "black",
    fontSize: 18,
  },
});
