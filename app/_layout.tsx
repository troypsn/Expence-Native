import { Stack } from "expo-router";
import Background from "./components/Background";

export default function RootLayout() {
  return (
    <Background>
      <Stack screenOptions={{headerShown: false}}>
      </Stack>
    </Background>
  );
}
