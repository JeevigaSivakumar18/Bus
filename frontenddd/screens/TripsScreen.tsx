import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";


export default function TripsScreen() {
  alert("Trips screen rendered");
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    alert("useEffect");
    loadTrips();
  }, []);

  const loadTrips = async () => {
    alert("loadTrips called");
    try {
      const data = await AsyncStorage.getItem("user");

      if (!data) return;

      const user = JSON.parse(data);

      const res = await API.get(`/trips/${user.id}`);
      console.log(res.data);
      alert(JSON.stringify(res.data));

      setTrips(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>

      <FlatList
        data={trips}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <Text>From: {item.from}</Text>
            <Text>To: {item.destination}</Text>
            <Text>Distance: {item.distance} km</Text>
            <Text>Alarm: {item.alarmDistance}</Text>
            <Text style={styles.date}>
  {new Date(item.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}
</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  date: {
  color: "#666",
  fontSize: 13,
  marginTop: 6,
},

});