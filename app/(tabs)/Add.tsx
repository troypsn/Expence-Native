import car from "@/assets/images/car.png";
import food from "@/assets/images/food.png";
import money from "@/assets/images/money.png";
import { useAuth } from "@/lib/authContext";
import { insertShortcut, insertTransaction } from "@/lib/db";
import { useNetwork } from "@/lib/networkContext";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import Background from "../components/Background";

export default function Add() {
  const router = useRouter();
  const { isLoggedIn, isGuest, userId } = useAuth();
  const { isOnline } = useNetwork();

  const [icon, setIcon] = useState("money");
  const [type, setType] = useState("expense");
  const [expenseDetails, setExpenseDetails] = useState({
    title: "",
    amount: "",
    description: "",
  });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestImagePermissions(type: "camera" | "library") {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  async function pickImage(fromCamera: boolean) {
    const permissionGranted = await requestImagePermissions(
      fromCamera ? "camera" : "library",
    );
    if (!permissionGranted) {
      Alert.alert(
        "Permissions needed",
        "Please allow access to your camera or photos.",
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });

    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function openPhotoPicker() {
    Alert.alert("Add Photo", "Choose a photo source.", [
      { text: "Take Photo", onPress: () => pickImage(true) },
      { text: "Upload Photo", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function handleAdd(addType: string) {
    if (loading) return;

    // Shortcuts require a logged-in account
    if (addType === "shortcut" && !isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need an account to create shortcuts. Shortcuts are synced to the cloud.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/Login") },
        ],
      );
      return;
    }

    const { title, amount, description } = expenseDetails;

    if (!title.trim() || !amount.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();

    const selectedImage = photoUri ?? icon;
    const isLocalPhoto =
      selectedImage?.startsWith("file://") ||
      selectedImage?.startsWith("content://") ||
      selectedImage?.startsWith("data:");

    if (addType === "expense") {
      // ─── Save expense to local SQLite first (always) ───
      const localId = await insertTransaction({
        remote_id: null,
        user_id: isLoggedIn ? userId : null,
        title,
        amount: parseFloat(amount),
        image: selectedImage,
        description,
        created_at: now,
        synced: 0,
        is_guest: isGuest ? 1 : 0,
      });

      // ─── Background Sync to Supabase for icon-only transactions ───
      if (!isLocalPhoto && isLoggedIn && isOnline && userId) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from("transactions")
              .insert({
                user_id: userId,
                title,
                amount: parseFloat(amount),
                image: selectedImage,
                description,
                created_at: now,
              })
              .select("transaction_id")
              .single();

            if (!error && data?.transaction_id) {
              const { markTransactionSynced } = await import("@/lib/db");
              await markTransactionSynced(localId, data.transaction_id);
            }
          } catch (e) {
            console.warn("[add] Background sync failed:", e);
          }
        })();
      }
    } else {
      // ─── Shortcut (only for logged-in users) ───
      const localId = await insertShortcut({
        remote_id: null,
        user_id: userId,
        title,
        amount: parseFloat(amount),
        image: selectedImage,
        description,
        created_at: now,
        synced: 0,
        is_guest: 0,
        require_photo: requirePhoto ? 1 : 0,
      });

      // ─── Background Sync to Supabase for icon-only shortcuts ───
      if (!isLocalPhoto && isOnline && userId) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from("shortcuts")
              .insert({
                user_id: userId,
                title,
                amount: parseFloat(amount),
                image: selectedImage,
                description,
                created_at: now,
              })
              .select("shortcut_id")
              .single();

            if (!error && data?.shortcut_id) {
              const { markShortcutSynced } = await import("@/lib/db");
              await markShortcutSynced(localId, data.shortcut_id);
            }
          } catch (e) {
            console.warn("[add] Background sync failed:", e);
          }
        })();
      }
    }

    // ─── Immediate Feedback ───
    setExpenseDetails({ title: "", amount: "", description: "" });
    setPhotoUri(null);
    setRequirePhoto(false);
    setLoading(false);
    Alert.alert(
      "Success",
      `${addType === "expense" ? "Expense" : "Shortcut"} saved locally!`,
    );
    router.replace("/(tabs)/Home");
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
            <Text style={styles.title}>Add</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Type</Text>
              <View style={styles.pickIcon}>
                <Pressable
                  onPress={() => setType("expense")}
                  style={styles.typeContainer}
                >
                  <Text
                    style={[
                      styles.type,
                      type === "expense" && styles.typeSelected,
                    ]}
                  >
                    Expense
                  </Text>
                </Pressable>
                {isLoggedIn && (
                  <Pressable
                    onPress={() => setType("shortcut")}
                    style={styles.typeContainer}
                  >
                    <Text
                      style={[
                        styles.type,
                        type === "shortcut" && styles.typeSelected,
                      ]}
                    >
                      Shortcut
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Icon</Text>
              <View style={styles.pickIcon}>
                <Pressable
                  onPress={() => setIcon("money")}
                  style={styles.iconContainer}
                >
                  <Image
                    source={money}
                    style={[
                      styles.icon,
                      icon === "money" && styles.selectedIcon,
                    ]}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setIcon("car")}
                  style={styles.iconContainer}
                >
                  <Image
                    source={car}
                    style={[styles.icon, icon === "car" && styles.selectedIcon]}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setIcon("food")}
                  style={styles.iconContainer}
                >
                  <Image
                    source={food}
                    style={[
                      styles.icon,
                      icon === "food" && styles.selectedIcon,
                    ]}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                placeholder="Enter Expense Title"
                placeholderTextColor="gray"
                style={styles.textInput}
                value={expenseDetails.title}
                onChangeText={(text) =>
                  setExpenseDetails({ ...expenseDetails, title: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                placeholder="Enter Expense Amount"
                placeholderTextColor="gray"
                style={styles.textInput}
                keyboardType="numeric"
                value={expenseDetails.amount}
                onChangeText={(text) =>
                  setExpenseDetails({ ...expenseDetails, amount: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter Expense Description"
                placeholderTextColor="gray"
                style={styles.textInputDescription}
                multiline
                textAlignVertical="top"
                value={expenseDetails.description}
                onChangeText={(text) =>
                  setExpenseDetails({ ...expenseDetails, description: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Pressable style={styles.photoButton} onPress={openPhotoPicker}>
                <Text style={styles.photoButtonText}>
                  {photoUri ? "Change Photo" : "Add Photo (Optional)"}
                </Text>
              </Pressable>
              {photoUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                  />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    style={styles.photoRemoveButton}
                  >
                    <Text style={styles.photoRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

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

            <Pressable style={styles.addButton} onPress={() => handleAdd(type)}>
              <Text style={styles.addButtonText}>
                Add {type === "expense" ? "Expense" : "Shortcut"}
              </Text>
            </Pressable>

            {/* Offline indicator */}
            {!isOnline && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineBannerText}>
                  ⚡ OFFLINE — will sync when online
                </Text>
              </View>
            )}

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
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
    paddingTop: 50,
  },
  inputContainer: {
    padding: 5,
    alignItems: "flex-start",
    justifyContent: "center",
    width: "70%",
    marginBottom: 16,
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
    width: 40,
    height: 40,
    margin: 10,
    borderColor: "white",
    borderWidth: 1.5,
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
  label: {
    fontFamily: "VCR-Mono",
    color: "white",
    marginBottom: 4,
  },
  title: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 28,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    width: "67%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  addButtonText: {
    fontFamily: "VCR-Mono",
    color: "black",
    fontSize: 18,
  },
  photoButton: {
    display: "flex",
    alignContent: "center",
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
  typeContainer: {
    justifyContent: "space-between",
  },
  type: {
    color: "white",
    fontFamily: "VCR-Mono",
  },
  typeSelected: {
    color: "red",
  },
  offlineBanner: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 180, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 0, 0.4)",
  },
  offlineBannerText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255, 200, 0, 0.9)",
    fontSize: 11,
  },
});
