import React, { useEffect, useRef, useState } from 'react';
import API from "../services/api";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";

import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import * as Location from 'expo-location';
import { router } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';

import { Audio } from "expo-av";

// ─────────────────────────────────────────────
// Haversine — returns distance in km
// ─────────────────────────────────────────────
function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const sounds = {
  Bell: require("../assets/bell.mp3"),
  Siren: require("../assets/siren.mp3"),
  Beep: require("../assets/beep.mp3"),
  Voice: require("../assets/voice.mp3"),
};

export default function HomeScreen() {
  const [destination, setDestination] = useState('');
  const [alarmDistance, setAlarmDistance] = useState("2 km");

const [alarmSound, setAlarmSound] =
  useState<"Bell" | "Siren" | "Beep" | "Voice">("Bell");

const [alarmVolume, setAlarmVolume] = useState(0.8);
  const [currentLocation, setCurrentLocation] = useState('');

  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [destinationLat, setDestinationLat] = useState(0);
  const [destinationLng, setDestinationLng] = useState(0);
  const [destinationName, setDestinationName] = useState('');

  const [remainingDistance, setRemainingDistance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 11.3428,
    longitude: 77.7274,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef<MapView>(null);
  const startingDistanceRef = useRef(0);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const alarmSoundRef = useRef<Audio.Sound | null>(null); 


  const [user, setUser] =  useState<User | null>(null);

useEffect(() => {
  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");

    if (data) {
      setUser(JSON.parse(data));
    }
  };

  loadUser();
},[]);


  useFocusEffect(
  useCallback(() => {
    const loadAlarmSettings = async () => {
      const d = await AsyncStorage.getItem("alarmDistance");
      const s = await AsyncStorage.getItem("alarmSound");
      const v = await AsyncStorage.getItem("alarmVolume");

      if (d) setAlarmDistance(d);
      if (s && s in sounds) setAlarmSound(s as keyof typeof sounds);
      if (v) setAlarmVolume(Number(v));
    };

    loadAlarmSettings();
  }, [])
);



  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ─────────────────────────────────────────────
  // Detect current GPS location
  // ─────────────────────────────────────────────
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude: lat, longitude: lng } = location.coords;
      setLatitude(lat);
      setLongitude(lng);

      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

     try {
  const address = await Location.reverseGeocodeAsync({
    latitude: lat,
    longitude: lng,
  });

  if (address.length > 0) {
    setCurrentLocation(
      `${address[0].city}, ${address[0].region}`
    );
  }
} catch (err) {
  console.log("Reverse geocode failed:", err);

  setCurrentLocation(
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  );
}
  }
  catch (error) {
  console.error("getCurrentLocation error:", error);
  Alert.alert("Error", "Could not get your location.");
}
    };

  // ─────────────────────────────────────────────
  // Search destination — Photon API (no key, no User-Agent needed)
  // ─────────────────────────────────────────────
  const searchDestination = async () => {
    if (!destination.trim()) {
      Alert.alert('Input Required', 'Please enter a destination.');
      return;
    }

    setIsSearching(true);

    try {
      const query = encodeURIComponent(destination.trim());
      const url = `https://photon.komoot.io/api/?q=${query}&limit=1&lang=en`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        Alert.alert('Not Found', `No results for "${destination}"`);
        return;
      }

      // GeoJSON: coordinates are [longitude, latitude] — NOT [lat, lng]
      const feature = data.features[0];
      const destLng = feature.geometry.coordinates[0];
      const destLat = feature.geometry.coordinates[1];
      const placeName = feature.properties.name ?? destination;

      setDestinationLat(destLat);
      setDestinationLng(destLng);
      setDestinationName(placeName);
      setDestination(placeName);

      const newRegion: Region = {
        latitude: destLat,
        longitude: destLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // ─────────────────────────────────────────────
  // Map tap — drop pin at tapped location
  // ─────────────────────────────────────────────
  const handleMapPress = async (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;

    setDestinationLat(lat);
    setDestinationLng(lng);

    try {
      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (address.length > 0) {
        const place =
          address[0].name ||
          address[0].street ||
          address[0].district ||
          address[0].city ||
          'Selected Location';
        setDestination(place);
        setDestinationName(place);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setDestinationName('Selected Location');
    }
  };

  // ─────────────────────────────────────────────
  // Alarm trigger — vibrate + alert
  // ─────────────────────────────────────────────
 const triggerAlarm = async (currentDist: number, alarmDist: number) => {
  if (locationWatcherRef.current) {
    locationWatcherRef.current.remove();
    locationWatcherRef.current = null;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(sounds[alarmSound]);
    alarmSoundRef.current = sound; // store it so we can stop it

    await sound.setVolumeAsync(alarmVolume);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        alarmSoundRef.current = null;
      }
    });
  } catch (err) {
    console.log("Sound error:", err);
  }

  await saveTrip();

  Alert.alert(
    "⏰ Wake Up!",
    `You are ${currentDist.toFixed(2)} km from your destination!`,
    [{
      text: "Stop Alarm",
      onPress: async () => {
        if (alarmSoundRef.current) {
          await alarmSoundRef.current.stopAsync();
          await alarmSoundRef.current.unloadAsync();
          alarmSoundRef.current = null;
        }
      },
    }]
  );

  setJourneyStarted(false);
  setProgress(100);
};

  // ─────────────────────────────────────────────
  // Stop Journey
  // ─────────────────────────────────────────────
  const stopJourney = async() => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
    setJourneyStarted(false);
    setProgress(0);
    setRemainingDistance(0);
    await saveTrip();
    Alert.alert('Journey Stopped', 'Tracking has been stopped.');
  };

  // ─────────────────────────────────────────────
  // Start Journey
  //
  // BUG FIXED: Previously the function body closed early after Alert.alert()
  // so initialDistance calc and watchPositionAsync were running at module
  // level — causing an immediate crash. Everything is now correctly inside
  // the async function body.
  //
  // BUG FIXED: setJourneyStarted(true) was called twice.
  //
  // BUG FIXED: Early return for missing location was after setJourneyStarted(true)
  // so the button would get stuck in "Stop Journey" state even on early exit.
  // ─────────────────────────────────────────────

  // Add this function inside your HomeScreen component
const saveTrip = async () => {
  try {
    if (!user) {
      console.log("saveTrip: no user");
      return;
    }

    if (!destinationName) {
      console.log("saveTrip: no destination name");
      return;
    }

    const tripPayload = {
      user: user.id,                                        // ✅ matches schema
      from: currentLocation || "Unknown Location",          // ✅ required field
      destination: destinationName,                         // ✅ required field
      distance: parseFloat(startingDistanceRef.current      // ✅ required field
                  .toFixed(2)),
      alarmDistance: alarmDistance,                         // ✅ required field
    };

    console.log("Saving trip payload:", tripPayload);

    await API.post("/trips", tripPayload);

    console.log("Trip saved successfully");

  } catch (err: any) {
    console.log("saveTrip error:", err.response?.data || err.message);
  }
};




  const startJourney = async () => {
    // --- All validation BEFORE any state changes ---
    if (latitude === 0 || longitude === 0) {
      Alert.alert('Location Required', "Please tap 'Detect Location' first.");
      return;
    }

    if (destinationLat === 0 || destinationLng === 0) {
      Alert.alert('No Destination', 'Please select a destination first.');
      return;
    }

    if (!alarmDistance) {
  Alert.alert(
    "Alarm Not Configured",
    "Go to Alarm Settings and save an alarm distance."
  );
  return;
}

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    // --- Calculate starting distance BEFORE setting state ---
    const initialDistance = getDistanceKm(
      latitude,
      longitude,
      destinationLat,
      destinationLng
    );

    startingDistanceRef.current = initialDistance;
    setRemainingDistance(initialDistance);
    setProgress(0);
    setJourneyStarted(true); // Only called ONCE, only after all checks pass

    Alert.alert(
      'Journey Started',
      `${initialDistance.toFixed(1)} km to destination.\nAlarm at ${alarmDistance}.`
    );

    

    const alarmKmMap: Record<string, number> = {
  "500 m": 0.5,
  "1 km": 1,
  "2 km": 2,
  "5 km": 5,
};

const alarmKm = alarmKmMap[alarmDistance];

if (!alarmKm) {
  Alert.alert(
    "Alarm Not Configured",
    "Go to Alarm Settings and save a distance first."
  );
  return;
}
    // --- Start live position watcher ---
    locationWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
      },
      async(location) => {
        const { latitude: lat, longitude: lng } = location.coords;

        setLatitude(lat);
        setLongitude(lng);

        // Smoothly move bus marker
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          300
        );

        // Distance remaining
        const distanceKm = getDistanceKm(lat, lng, destinationLat, destinationLng);
        setRemainingDistance(distanceKm);

        // Progress = how much of the starting distance has been covered
        if (startingDistanceRef.current > 0) {
          const covered = startingDistanceRef.current - distanceKm;
          const pct = (covered / startingDistanceRef.current) * 100;
          setProgress(Math.min(Math.max(pct, 0), 100));
        }

        console.log(`Distance remaining: ${distanceKm.toFixed(2)} km`);

        // Alarm check
        if (distanceKm <= alarmKm) {
          await triggerAlarm(distanceKm, alarmKm);
        }
      }
    );
  }; // <-- startJourney correctly closes here

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >


    
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>
          Hi {user?.name}👋
        </Text>
        <Text style={styles.headerSubtitle}>Ready for your journey?</Text>
      </View>

      {/* Current Location */}
      <Text style={styles.label}>📍 Current Location</Text>
      <TouchableOpacity style={styles.locationBox} onPress={getCurrentLocation}>
        <Text style={styles.locationText}>
          {currentLocation || 'Tap to Detect Location'}
        </Text>
      </TouchableOpacity>

      {/* Destination */}
      <Text style={styles.label}>🏁 Destination</Text>
      <TextInput
        placeholder="Enter Destination (e.g. Salem Bus Stand)"
        value={destination}
        onChangeText={setDestination}
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={searchDestination}
      />
      <TouchableOpacity
        style={[styles.searchButton, isSearching && styles.disabledButton]}
        onPress={searchDestination}
        disabled={isSearching}
      >
        <Text style={styles.searchButtonText}>
          {isSearching ? 'Searching...' : 'Search Destination'}
        </Text>
      </TouchableOpacity>

      {/* Map */}
      <Text style={styles.label}>🗺 Map — Tap to Set Destination</Text>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={handleMapPress}
      >
        {latitude !== 0 && longitude !== 0 && (
          <Marker coordinate={{ latitude, longitude }}>
            <Text style={{ fontSize: 30 }}>🚌</Text>
          </Marker>
        )}
        {destinationLat !== 0 && destinationLng !== 0 && (
          <Marker
            coordinate={{ latitude: destinationLat, longitude: destinationLng }}
            pinColor="red"
            title="Destination"
            description={destinationName}
          />
        )}
      </MapView>

      {/* Selected Destination */}
      <Text style={styles.label}>📌 Selected Destination</Text>
      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          {destinationName || 'No destination selected'}
        </Text>
      </View>

      

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Journey Progress</Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Stats row */}
        <View style={styles.progressStatsRow}>
          <Text style={styles.progressStat}>
            {progress.toFixed(0)}% covered
          </Text>
          <Text style={styles.progressStat}>
            {journeyStarted
              ? `${remainingDistance.toFixed(2)} km left`
              : 'Start journey to track'}
          </Text>
        </View>
      </View>

      {/* Start / Stop */}
      <TouchableOpacity
        style={[styles.startButton, journeyStarted && styles.stopButton]}
        onPress={journeyStarted ? stopJourney : startJourney}
      >
        <Text style={styles.startButtonText}>
          {journeyStarted ? '⏹ Stop Journey' : '▶ Start Journey'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 80,
  },
  headerCard: {
    backgroundColor: '#D2691E',
    padding: 20,
    borderRadius: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    color: 'white',
    marginTop: 5,
  },
  label: {
    marginTop: 15,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  locationBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
  },
  locationText: {
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  distanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceButton: {
    backgroundColor: '#FFE4C4',
    padding: 12,
    borderRadius: 10,
    width: 90,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#D2691E',
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  progressCard: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
  },
  progressTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: '#D2691E',
    borderRadius: 10,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressStat: {
    fontSize: 12,
    color: '#666',
  },
  startButton: {
    backgroundColor: '#D2691E',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  stopButton: {
    backgroundColor: '#8B0000',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomNav: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#8B4513',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});