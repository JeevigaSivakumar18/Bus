import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

interface Trip {
  _id: string;
  from: string;
  destination: string;
  distance: number;
  alarmDistance: string;
  createdAt: string; // always present because of { timestamps: true }
}

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const data = await AsyncStorage.getItem("user");

      if (!data) {
        setError("Not logged in.");
        return;
      }

      const user = JSON.parse(data);

      // Debug: log what user object looks like so you can confirm .id exists
      console.log("User from storage:", JSON.stringify(user));

      const res = await API.get(`/trips/${user.id}`);

      // Debug: log first item so you can confirm createdAt is present
      if (res.data.length > 0) {
        console.log("First trip:", JSON.stringify(res.data[0], null, 2));
      }

      setTrips(res.data);
    } catch (err: any) {
      console.log("Trip load error:", err.response?.data || err.message);
      setError("Failed to load trips.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Safe date formatter — never crashes even if
  // createdAt is undefined or malformed
  // ─────────────────────────────────────────────
  const formatDate = (createdAt: string | undefined): string => {
    if (!createdAt) return "Date unavailable";

    const date = new Date(createdAt);

    // Check if the date parsed correctly
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D2691E" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
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

              {/* Route */}
              <Text style={styles.heading}>
                {item.from} ➜ {item.destination}
              </Text>

              {/* Stats */}
              <Text style={styles.detail}>
                📏 Distance: {item.distance} km
              </Text>
              <Text style={styles.detail}>
                ⏰ Alarm: {item.alarmDistance}
              </Text>

              {/* Date — this is what was missing in Trips.tsx */}
              <Text style={styles.date}>
                🕐 {formatDate(item.createdAt)}
              </Text>

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
    paddingTop: 80,
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
    marginTop: 40,
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 18,
    color: "gray",
  },
  errorText: {
    color: "red",
    fontSize: 16,
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
    color: "#333",
  },
  detail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },
  date: {
    color: "#888",
    fontSize: 13,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0e0d0",
    paddingTop: 8,
  },
});