const car = require("@/assets/images/car.png");
const food = require("@/assets/images/food.png");
const money = require("@/assets/images/money.png");
import { useAuth } from "@/lib/authContext";
import { insertShortcut, insertTransaction, decrementOcrUsageRemote } from "@/lib/db";
import { useNetwork } from "@/lib/networkContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FontAwesome5 } from '@expo/vector-icons';
import { extractReceiptData } from "@/lib/ocr";
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
import Background from "../components/Background";
// Lazy-load expo-image-picker to avoid createPermissionHook errors on older SDKs
let ImagePicker: any;

function Add() {
  const router = useRouter();
  const { isLoggedIn, isGuest, userId, isPremium, ocrScansRemaining, decrementOcrScanLocally } = useAuth();
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
  const [isScanning, setIsScanning] = useState(false);


  async function handleScanReceipt() {
    if (!isPremium && typeof ocrScansRemaining === 'number' && ocrScansRemaining <= 0) {
      Alert.alert('Limit Reached', 'You have used all your free OCR scans for this month. Upgrade to Premium for unlimited scans.');
      return;
    }

    try {
      if (!ImagePicker) {
        const module = await import("expo-image-picker");
        ImagePicker = module;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        setIsScanning(true);
        const { title, amount } = await extractReceiptData(result.assets[0].uri);

        if (title || amount) {
          setExpenseDetails(prev => ({
            ...prev,
            title: title || prev.title,
            amount: amount || prev.amount
          }));
          Alert.alert('Scan Success', 'Extracted details from receipt.');
        } else {
          Alert.alert('Scan Failed', 'Could not read text from receipt clearly.');
        }

        if (userId && !isGuest && !isPremium) {
          decrementOcrScanLocally();
          decrementOcrUsageRemote(userId);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to access camera or scan receipt.");
    } finally {
      setIsScanning(false);
    }
  }

  async function pickImage(fromCamera: boolean) {
    try {
      // Dynamically import expo-image-picker if not already loaded
      if (!ImagePicker) {
        const module = await import("expo-image-picker");
        ImagePicker = module;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        })
        : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to access camera or photos. Please check your permissions.",
      );
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

    if (addType === "expense") {
      // ─── Save expense to local SQLite first (always) ───
      await insertTransaction({
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
    } else {
      // ─── Shortcut (only for logged-in users) ───
      await insertShortcut({
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
    }

    // ─── Trigger Sync to Supabase ───
    if (isLoggedIn && isOnline && userId) {
      (async () => {
        try {
          const { syncPendingData } = await import("@/lib/sync");
          await syncPendingData(userId);
        } catch (e) {
          console.warn("[add] Background sync failed:", e);
        }
      })();
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
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Add</Text>
              <Pressable style={styles.cameraIconContainer} onPress={handleScanReceipt} disabled={isScanning}>
                {isScanning ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <FontAwesome5 name="camera" size={20} color="white" />
                    <Text style={styles.cameraUsesText}>
                      {isPremium ? '∞' : `${ocrScansRemaining}/5`}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

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
  },
  headerContainer: {
    width: "70%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cameraIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  cameraUsesText: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 14,
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

export default Add;
