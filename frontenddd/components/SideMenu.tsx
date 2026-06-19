import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
   onClose: () => void;
};

export default function SideMenu({ visible , onClose }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.sideMenu}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onClose();
          router.push("/home");}}
      >
        <Text style={styles.menuText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onClose();
          router.push("/trips")}}
      >
        <Text style={styles.menuText}>Trips</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onClose();
          router.push("/alarm")}}
      >
        <Text style={styles.menuText}>Alarm</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onClose();
          router.push("/emergency")}}
      >
        <Text style={styles.menuText}>Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() =>{
          onClose();
          router.push("/offline")}}
      >
        <Text style={styles.menuText}>Offline</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onClose();
          router.replace("/login")}}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sideMenu: {
    position: "absolute",
    top: 100,
    left: 10,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 15,
    elevation: 10,
    zIndex: 999,
  },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  menuText: {
    fontSize: 16,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
});