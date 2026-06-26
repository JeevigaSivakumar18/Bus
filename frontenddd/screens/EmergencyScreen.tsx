import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../services/api";

export default function EmergencyScreen() {
  const [saved, setSaved] = useState(false);

  const [contact1Name, setContact1Name] = useState("");
  const [contact1Phone, setContact1Phone] = useState("");
  const [contact2Name, setContact2Name] = useState("");
  const [contact2Phone, setContact2Phone] = useState("");
  const [contact3Name, setContact3Name] = useState("");
  const [contact3Phone, setContact3Phone] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = user.id ?? user._id;

      console.log("Loading contacts for userId:", userId);

      // FIX: path must match server.js mount point
      // server.js: app.use("/api/users", authRoutes)
      // authRoutes: router.get("/emergency/:userId", getContacts)
      // Full path = /api/users/emergency/:userId
      // If your api.js baseURL is "http://IP:5000/api" → use "/users/emergency/:id"
      // If your api.js baseURL is "http://IP:5000"     → use "/api/users/emergency/:id"
      const res = await API.get(`/users/emergency/${userId}`);

      console.log("Contacts loaded:", res.data);

      if (res.data && res.data.length > 0) {
        setSaved(true);

        if (res.data[0]) {
          setContact1Name(res.data[0].name ?? "");
          setContact1Phone(res.data[0].phone ?? "");
        }
        if (res.data[1]) {
          setContact2Name(res.data[1].name ?? "");
          setContact2Phone(res.data[1].phone ?? "");
        }
        if (res.data[2]) {
          setContact3Name(res.data[2].name ?? "");
          setContact3Phone(res.data[2].phone ?? "");
        }
      }
    } catch (err: any) {
      console.log("loadContacts error:", err.response?.data || err.message);
    }
  };

  const saveContacts = async () => {
    try {
      if (
        contact1Phone.trim() === "" &&
        contact2Phone.trim() === "" &&
        contact3Phone.trim() === ""
      ) {
        Alert.alert("Required", "Please enter at least one contact.");
        return;
      }

      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      const user = JSON.parse(userData);

      // FIX: handle both id and _id — MongoDB stores as _id,
      // your loginUser sends it as id. Use whichever exists.
      const userId = user.id ?? user._id;

      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        console.log("Full user object from storage:", user);
        return;
      }

      // Only include contacts that have a phone number
      const contacts = [
        { name: contact1Name.trim(), phone: contact1Phone.trim() },
        { name: contact2Name.trim(), phone: contact2Phone.trim() },
        { name: contact3Name.trim(), phone: contact3Phone.trim() },
      ].filter((c) => c.phone !== "");

      console.log("Saving contacts:", { userId, contacts });

      const res = await API.post("/users/emergency", {
        userId,
        contacts,
      });

      console.log("Save response:", res.data);

      Alert.alert("Saved", "Emergency contacts saved successfully.");
      setSaved(true);

    } catch (err: any) {
      console.log("saveContacts error:", err.response?.data || err.message);
      Alert.alert(
        "Failed",
        err.response?.data?.message ?? "Could not save contacts. Check your connection."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>🚨 Emergency</Text>

      {!saved ? (
        <>
          <Text style={styles.subtitle}>
            Add emergency contacts who will receive your location during an emergency.
          </Text>

          <Text style={styles.contactLabel}>Contact 1</Text>
          <TextInput
            placeholder="Name"
            value={contact1Name}
            onChangeText={setContact1Name}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone Number"
            value={contact1Phone}
            onChangeText={setContact1Phone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.contactLabel}>Contact 2</Text>
          <TextInput
            placeholder="Name"
            value={contact2Name}
            onChangeText={setContact2Name}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone Number"
            value={contact2Phone}
            onChangeText={setContact2Phone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.contactLabel}>Contact 3</Text>
          <TextInput
            placeholder="Name"
            value={contact3Name}
            onChangeText={setContact3Name}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone Number"
            value={contact3Phone}
            onChangeText={setContact3Phone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveContacts}>
            <Text style={styles.buttonText}>Save Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSaved(true)}>
            <Text style={styles.skip}>Skip for now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.ready}>
            Your emergency contacts are ready.
          </Text>

          <View style={styles.card}>
            {contact1Phone !== "" && (
              <Text style={styles.contact}>
                👤 {contact1Name}{"\n"}📞 {contact1Phone}
              </Text>
            )}
            {contact2Phone !== "" && (
              <Text style={styles.contact}>
                👤 {contact2Name}{"\n"}📞 {contact2Phone}
              </Text>
            )}
            {contact3Phone !== "" && (
              <Text style={styles.contact}>
                👤 {contact3Name}{"\n"}📞 {contact3Phone}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.sosButton}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.hold}>Hold for 3 seconds</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setSaved(false)}
          >
            <Text style={styles.buttonText}>Edit Contacts</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 20,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 25,
    lineHeight: 24,
  },
  contactLabel: {
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 6,
    marginTop: 10,
    fontSize: 15,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#D2691E",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  skip: {
    marginTop: 20,
    textAlign: "center",
    color: "#8B4513",
    fontWeight: "600",
  },
  ready: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
    color: "#444",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  contact: {
    fontSize: 17,
    marginVertical: 8,
    lineHeight: 26,
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#D50000",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 40,
    elevation: 10,
  },
  sosText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 42,
  },
  hold: {
    textAlign: "center",
    marginTop: 15,
    color: "#555",
    fontSize: 16,
  },
  editButton: {
    marginTop: 40,
    backgroundColor: "#D2691E",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});