import React, { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import * as Location from 'expo-location';
import { router } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { Vibration } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

// ─────────────────────────────────────────────
// Haversine formula — needed for alarm feature
// Returns distance in kilometres between two coords
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

export default function HomeScreen() {
  const [destination, setDestination] = useState('');
  const [alarmDistance, setAlarmDistance] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');

  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [destinationLat, setDestinationLat] = useState(0);
  const [destinationLng, setDestinationLng] = useState(0);
  const [destinationName, setDestinationName] = useState('');

  const[remainingDistance , setRemainingDistance] = useState(0);
  // Controls the visible map region — must be state, not hardcoded
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 11.3428,
    longitude: 77.7274,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  const mapRef = useRef<MapView>(null);

  const startingDistanceRef = useRef(0);

  // Stores the live position watcher so we can stop it later
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  

  const auth = getAuth();

  // ─────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      // Stop tracking before logout
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ─────────────────────────────────────────────
  // Get current GPS location
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

      // Move the map to the user's location
      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

      const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (address.length > 0) {
        setCurrentLocation(`${address[0].city}, ${address[0].region}`);
      }
    } catch (error) {
      console.error('getCurrentLocation error:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
  };


  // ─────────────────────────────────────────────
  // BUG FIX: Search destination using Nominatim
  //
  // Why NOT expo-location geocodeAsync:
  //   - Uses the device's native geocoder
  //   - Fails silently for landmark/POI names
  //   - Not designed for place-name search
  //
  // Why Nominatim works:
  //   - It IS a search engine for place names
  //   - Free, no API key needed
  //   - Requires a User-Agent header (was missing before — that caused Access Denied)
  // ─────────────────────────────────────────────
  
const searchDestination = async () => {
  if (!destination.trim()) {
    Alert.alert('Input Required', 'Please enter a destination.');
    return;
  }

  setIsSearching(true);

  try {
    const query = encodeURIComponent(destination.trim());
    
    // Photon — no User-Agent required, no API key, free
    const url = `https://photon.komoot.io/api/?q=${query}&limit=1&lang=en`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      Alert.alert('Not Found', `No results for "${destination}"`);
      return;
    }

    // Photon uses GeoJSON — coordinates are [longitude, latitude] (reversed!)
    const feature = data.features[0];
    const destLng = feature.geometry.coordinates[0];  // index 0 = longitude
    const destLat = feature.geometry.coordinates[1];  // index 1 = latitude
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
  // Map tap — drop destination pin (Option B)
  // This was mostly correct. Added destinationName fix.
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
        setDestinationName(place); // This was correct in your original
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setDestinationName('Selected Location');
    }
  };

  // ─────────────────────────────────────────────
  // Start Journey — live GPS tracking
  //
  // This is the stub for your future feature.
  // Uses Location.watchPositionAsync (not getCurrentPositionAsync)
  // which fires a callback every time your position changes.
  // ─────────────────────────────────────────────




const stopJourney = () => {
  if (locationWatcherRef.current) {
    locationWatcherRef.current.remove();
    locationWatcherRef.current = null;
  }

  setJourneyStarted(false);
  setProgress(0);

  Alert.alert(
    "Journey Stopped",
    "Tracking has been stopped."
  );
};

  const startJourney = async () => {
    if (destinationLat === 0 || destinationLng === 0) {
      Alert.alert('No Destination', 'Please select a destination first.');
      return;
    }

    if (!alarmDistance) {
      Alert.alert('No Alarm Distance', 'Please select a wake-up distance (1km, 2km, or 5km).');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for journey tracking.');
      return;
    }

    setJourneyStarted(true);
    if (latitude === 0 || longitude === 0) {
  Alert.alert(
    "Location Required",
    "Please tap 'Detect Location' first."
  );
  return;
}

setJourneyStarted(true);

Alert.alert(
  'Journey Started',
  `Alarm set for ${alarmDistance} from destination.`
);
}

    const initialDistance = getDistanceKm(
  latitude,
  longitude,
  destinationLat,
  destinationLng
);



startingDistanceRef.current = initialDistance;

setRemainingDistance(initialDistance);



    // Start watching position
    locationWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50, // Update every 50 metres to save battery
      },
      (location) => {
        const { latitude: lat, longitude: lng } = location.coords;

        setLatitude(lat);
        setLongitude(lng);

        // Move bus marker on map
        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 300);

        // Calculate distance to destination
       
    const distanceKm = getDistanceKm(
  lat,
  lng,
  destinationLat,
  destinationLng
);

// update remaining distance text
setRemainingDistance(distanceKm);

if (startingDistanceRef.current > 0) {

  const completed =
    ((startingDistanceRef.current - distanceKm)
      / startingDistanceRef.current) * 100;

  setProgress(
    Math.min(
      Math.max(completed, 0),
      100
    )
  );
}



        // Update progress bar
        // NOTE: for real progress you need the total distance at journey start
        // This is a rough approximation — improve when you add journey start point
        const alarmKm = parseFloat(alarmDistance.replace('km', ''));
        const remainingKm = distanceKm;
        // You'd want: const progressPct = ((totalDistance - remainingKm) / totalDistance) * 100
        // For now we just show distance remaining
        console.log(`Distance to destination: ${distanceKm.toFixed(2)} km`);

        // Alarm check — trigger when within chosen distance
        if (distanceKm <= alarmKm) {
          triggerAlarm(distanceKm, alarmKm);
        }

      }
   
   
    );
  };

 

  // ─────────────────────────────────────────────
  // Alarm trigger
  // Replace this Alert with expo-notifications for a real alarm sound
  // You'll need: expo install expo-notifications
  // ─────────────────────────────────────────────
  const triggerAlarm = (
  currentDist: number,
  alarmDist: number
) => {
  if (locationWatcherRef.current) {
    locationWatcherRef.current.remove();
    locationWatcherRef.current = null;
  }

  Vibration.vibrate(
    [500, 500, 500, 500, 500, 500],
    true
  );

  Alert.alert(
    "Wake Up!",
    "Destination Nearby",
    [
      {
        text: "Stop Alarm",
        onPress: () => Vibration.cancel(),
      },
    ]
  );

  setJourneyStarted(false);
  setProgress(100);
};
  

  return (
    // BUG FIX NOTE: ScrollView + MapView touch conflicts.
    // The map is inside a ScrollView which causes pan gesture conflicts.
    // Ideal fix: use a FlatList with the map as a header, or use
    // KeyboardAwareScrollView, or wrap map in a fixed-height View
    // and disable scroll when map is focused.
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.greeting}>
          Hi {auth.currentUser?.displayName ?? 'Traveller'}
        </Text>
        <Text style={styles.headerSubtitle}>Ready for your journey?</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Current Location */}
      <Text style={styles.label}>📍 Current Location</Text>
      <TouchableOpacity style={styles.locationBox} onPress={getCurrentLocation}>
        <Text style={styles.locationText}>
          {currentLocation || 'Tap to Detect Location'}
        </Text>
      </TouchableOpacity>

      {/* Destination Search */}
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
        // BUG FIX: region is now state-controlled so the map can pan
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={handleMapPress}
      >
        {/* Bus / current location marker */}
        {latitude !== 0 && longitude !== 0 && (
          <Marker coordinate={{ latitude, longitude }}>
            <Text style={{ fontSize: 30 }}>🚌</Text>
          </Marker>
        )}

        {/* Destination marker */}
        {destinationLat !== 0 && destinationLng !== 0 && (
          <Marker
            coordinate={{ latitude: destinationLat, longitude: destinationLng }}
            pinColor="red"
            title="Destination"
            description={destinationName}
          />
        )}
      </MapView>

      {/* Selected Destination Display */}
      <Text style={styles.label}>📌 Selected Destination</Text>
      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          {destinationName || 'No destination selected'}
        </Text>
      </View>

      {/* Alarm Distance */}
      <Text style={styles.label}>⏰ Wake Up Distance</Text>
      <View style={styles.distanceContainer}>
        {['1km', '2km', '5km'].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.distanceButton,
              alarmDistance === d && styles.selectedButton,
            ]}
            onPress={() => setAlarmDistance(d)}
          >
            <Text style={alarmDistance === d ? styles.selectedButtonText : {}}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Journey Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{remainingDistance.toFixed(2)} km Remaining</Text>
      </View>

      {/* Start / Stop Journey */}
      <TouchableOpacity
  style={styles.startButton}
  onPress={
  journeyStarted
    ? stopJourney
    : startJourney
}
>
        <Text style={styles.startButtonText}>
          {journeyStarted ? 'Stop Journey' : 'Start Journey'}
        </Text>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity><Text>🏠 Home</Text></TouchableOpacity>
        <TouchableOpacity><Text>🕒 Trips</Text></TouchableOpacity>
        <TouchableOpacity><Text>⚙ Alarm</Text></TouchableOpacity>
        <TouchableOpacity><Text>🚨 Alert</Text></TouchableOpacity>
        <TouchableOpacity><Text>📡 Offline</Text></TouchableOpacity>
      </View>
    </ScrollView>
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
  },

  progressFill: {
    height: 10,
    backgroundColor: '#D2691E',
    borderRadius: 10,
  },

  progressText: {
    marginTop: 10,
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

  disabledButton: {
    backgroundColor: '#ccc',
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

  map: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
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
});