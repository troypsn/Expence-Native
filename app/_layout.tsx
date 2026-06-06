import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { NetworkProvider } from "@/lib/networkContext";
import { initDb } from "@/lib/db";
import { syncPendingData } from "@/lib/sync";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#151269",
  },
};

function RootLayoutInner() {
  const { isLoggedIn, userId } = useAuth();

  // Initialise local DB once on mount
  useEffect(() => {
    initDb().catch((e) => console.warn("[db] Init error:", e));
  }, []);

  // Callback fired by NetworkProvider when device comes back online
  const handleComeOnline = useCallback(() => {
    if (isLoggedIn && userId) {
      console.log("[sync] Back online — starting sync...");
      syncPendingData(userId).catch((e) => console.warn("[sync] Error:", e));
    }
  }, [isLoggedIn, userId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkProvider onComeOnline={handleComeOnline}>
        <ThemeProvider value={AppTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#151269" },
              animation: "slide_from_right",
              animationDuration: 400,
            }}
          />
        </ThemeProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#151269" }}>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}