import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#0369a1",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "HomAI ✨" }} />
        <Stack.Screen name="result" options={{ title: "תוצאה" }} />
      </Stack>
    </>
  );
}
