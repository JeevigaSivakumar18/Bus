// app/_layout.tsx — ROOT layout
// No hamburger here. Just a plain Stack.
// Public screens (login, signup, welcome) get no menu.
// Protected screens get menu via (protected)/_layout.tsx

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}