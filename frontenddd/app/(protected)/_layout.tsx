// app/(protected)/_layout.tsx
// Every file inside (protected)/ gets the hamburger + SideMenu.
// login, signup, welcome are NOT inside here so they get nothing.

import { Stack } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SideMenu from "../../components/SideMenu";

export default function ProtectedLayout() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* All protected screens rendered here */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Hamburger — always on top of protected screens */}
      <TouchableOpacity
        style={styles.hamburger}
        onPress={() => setMenuVisible((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>

      {/* Side menu */}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 9999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 10,
  },
  hamburgerIcon: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
});