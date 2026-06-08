import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ScrollView } from 'react-native';


import { getAuth, signOut } from 'firebase/auth';

import { router } from 'expo-router';

import * as Location from 'expo-location';

import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen(){
    const [destination , setDestination ] = useState('');
    const [alarmDistance , setAlarmDistance] = useState('');
    const [currentLocation , setCurrentLocation] = useState('');

    const[latitude , setLatitude]= useState(0);
    const[longitude , setLongitude] = useState(0);

    const[destinationLat , setDestinationLat] = useState(0);
    const[destinationLng , setDestinationLng] = useState(0);

    const[destinationName , setDestinationName] = useState('');

    const auth = getAuth();
    const progress = 45;

   
    const handleLogout = async () => {
          try {
            await signOut(auth);
            router.replace('/login');
          }
          catch(error){
            console.log(error);
          }
        }
    
    const getCurrentLocation = async () => {
      try {
        const { status } = 
        await Location.requestForegroundPermissionsAsync();

        if(status !== 'granted') {
          alert('Location permission denied');
          return;
        }
        const location = 
        await Location.getCurrentPositionAsync({
          accuracy : Location.Accuracy.Highest,
        });

        const latitude = 
        location.coords.latitude;

        const longitude = 
        location.coords.longitude;

        setLatitude(latitude);
        setLongitude(longitude);

        const address = 
        await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        console.log(address);

        setCurrentLocation(
        `${address[0].city}, ${address[0].region}`
        );
      }
      catch(error) {
        console.log(error);
      }
    };



    const searchDestination = async () => {

      if(!destination.trim()){
        alert('Enter destination');
        return;
      }
      try{
        const response = await fetch(
           `https://nominatim.openstreetmap.org/search?q=${destination}&format=json&limit=1`
        );

        const data = await response.json();

        if(data.length === 0){
          alert('Destination not found');
          return;
        }
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        setDestinationLat(lat);
        setDestinationLng(lon);

        setDestinationName(data[0].display_name);
      }
      catch(error){
        console.log(error);
        alert('Error searchin destination')
      }
    }

    return (
      <ScrollView
      style = {styles.container}
      showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.greeting}>
                    Hi {auth.currentUser?.displayName}
                </Text>
                <Text style={styles.headerSubtitle}>
                    Ready for your journey?
                </Text>

                <TouchableOpacity
                   style={styles.logoutButton}
                   onPress={handleLogout}
                     >
                   <Text style={styles.logoutText}>
                          Logout
                      </Text>
                         </TouchableOpacity>
            </View>
            <Text style={styles.label}>
                📍Current Location
            </Text>
            <TouchableOpacity 
            style={styles.locationBox}
            onPress = {getCurrentLocation}>
                <Text style={styles.locationText}>
                    {currentLocation || 'Auto Detect Location'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>
               🏁 Destination
                   </Text>

                   <TextInput
                 placeholder="Enter Destination"
                 value={destination}
                 onChangeText={setDestination}
                 style={styles.input}
                />

              <TouchableOpacity
              style={styles.searchButton}
               onPress={searchDestination}
                 >
             <Text style={styles.searchButtonText}>
              Search Destination
                </Text>
             </TouchableOpacity>

            <Text style={styles.label}>
               🗺 Your Location
            </Text>

            <MapView
            style={styles.map}
            region={{
              latitude: latitude || 11.3428,
              longitude : longitude || 77.7274,
              latitudeDelta : 0.01,
              longitudeDelta : 0.01,
            }}

            onPress={async (e) => {

                const lat = e.nativeEvent.coordinate.latitude;
               const lng = e.nativeEvent.coordinate.longitude;

               setDestinationLat(lat);
               setDestinationLng(lng);

              try {

               const address =
              await Location.reverseGeocodeAsync({
                      latitude: lat,
                      longitude: lng,
                     });

                  const place =
                  `${address[0].city || ''}, ${address[0].region || ''}`;

                 setDestination(place);
                 setDestinationName(place);

                   } catch (error) {
                     console.log(error);
                         }
                       }}
            >
              {latitude !== 0 && longitude !== 0 && (
                <Marker 
                coordinate={{
                  latitude,
                  longitude,
                }}
                >
                  <Text style={{fontSize : 30}}>
                        🚌
                  </Text>
                  </Marker>
              )}

              {destinationLat !== 0 && 
               destinationLng !== 0 && (
                <Marker
                coordinate={{
                  latitude : destinationLat,
                  longitude : destinationLng,
                }}
                pinColor = "red"
                title="Destination"
                />
               )
              }
              </MapView>


              <Text style = {styles.label}>
                Selected Destination
              </Text>
              <Text>
             {destinationName || 'No destination selected'}
              </Text>
              
            <Text style={styles.label}>
                ⏰ Wake Up Distance
            </Text>
            <View style={styles.distanceContainer}>
                <TouchableOpacity style={[styles.distanceButton,
                  alarmDistance === '1km'&& styles.selectedButton]
                }
                onPress={() => setAlarmDistance('1km')}>
                    <Text>1km</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.distanceButton,
                  alarmDistance === '2km' && styles.selectedButton]
                }
                onPress = {() => setAlarmDistance('2km')}>
                    <Text>2km</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.distanceButton,
                  alarmDistance === '5km' && styles.selectedButton]
                }
                onPress = {() =>setAlarmDistance('5km')}>
                    <Text>5km</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>
                    Journey Progress
                </Text>

                  <View style={styles.progressBar}>
                  <View style={[styles.progressFill,
                    {width : `${progress}%`}
                  ]
                  }/>
                  </View>

                  <Text style={styles.progressText}>
                    {progress} Completed
                  </Text>
            </View>

            <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>
                    Start Journey
                </Text>
            </TouchableOpacity>

            <View style = {styles.bottomNav}>
              <TouchableOpacity>
                <Text>🏠 Home</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                <Text>🕒 Trips</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                <Text>⚙ Alarm</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                <Text>🚨 Alert</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                <Text>📡 Offline</Text>
                </TouchableOpacity>
            </View>


        </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 20,
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

  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },

  bottomNav: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  selectedButton: {
  backgroundColor: '#D2691E',
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