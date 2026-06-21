import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await AsyncStorage.getItem("user");

      if (!data) return;

      const user = JSON.parse(data);

      const res = await API.get(`/trips/${user.id}`);

      setTrips(res.data);
    } catch (err) {
      console.log("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D2691E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>

      {trips.length === 0 ? (
        <Text style={styles.empty}>No trips found.</Text>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.heading}>
                {item.from} ➜ {item.destination}
              </Text>

              <Text>Distance: {item.distance} km</Text>

              <Text>Alarm: {item.alarmDistance}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF8F0",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#8B4513",
  },

  empty: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 18,
    color: "gray",
  },

  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },

  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});