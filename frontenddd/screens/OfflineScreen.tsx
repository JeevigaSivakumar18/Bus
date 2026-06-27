import { StyleSheet, Text, View } from "react-native";

export default function OfflineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📴</Text>

      <Text style={styles.title}>
        Offline Mode
      </Text>

      <Text style={styles.message}>
        This feature is not available right now.
      </Text>

      <Text style={styles.subMessage}>
        We're working on bringing offline functionality in a future update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  icon: {
    fontSize: 70,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 15,
  },

  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginBottom: 10,
  },

  subMessage: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
});