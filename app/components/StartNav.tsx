import { useAuth } from "@/lib/authContext";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

function StartNav() {
  const [fontsLoaded] = useFonts({
    "VCR-Mono": require("../../assets/fonts/VCR_OSD_MONO_1.001.ttf"),
  });

  const router = useRouter();
  const { continueAsGuest } = useAuth();

  if (!fontsLoaded) return null;

  const handleGuest = async () => {
    await continueAsGuest();
    router.replace("/(tabs)/Home");
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push("/auth/Login")}
        style={styles.button}
      >
        <Text style={styles.navText}>LOGIN</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/auth/Register")}
        style={styles.button}
      >
        <Text style={styles.navText}>SIGN UP</Text>
      </Pressable>

      <Pressable
        onPress={handleGuest}
        style={[styles.button, styles.guestButton]}
      >
        <Text style={[styles.navText, styles.guestText]}>
          USE WITHOUT ACCOUNT
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/main/About")}
        style={styles.button}
      >
        <Text style={styles.navText}>ABOUT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    maxHeight: 450,
  },
  button: {
    alignItems: "center",
  },
  navText: {
    color: "white",
    padding: 8,
    fontFamily: "VCR-Mono",
    fontSize: 24,
  },
  guestButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  guestText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  smallText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
});

export default StartNav;
