import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";


export default function Alarm() {
  const [distance, setDistance] = useState("2 km");
  const [sound, setSound] = useState<keyof typeof sounds>("Bell");
  const [volume, setVolume] = useState(0.8);

  const sounds = {
  Bell: require("../../assets/bell.mp3"),
  Siren: require("../../assets/siren.mp3"),
  Beep: require("../../assets/beep.mp3"),
  Voice: require("../../assets/voice.mp3"),
};

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
  try {
    const d = await AsyncStorage.getItem("alarmDistance");
    const s = await AsyncStorage.getItem("alarmSound");
    const v = await AsyncStorage.getItem("alarmVolume");

    if (d) setDistance(d);

    if (s && s in sounds) {
      setSound(s as keyof typeof sounds);
    }

    if (v) setVolume(Number(v));
  } catch (err) {
    console.log(err);
  }
};

  const saveSettings = async () => {
    await AsyncStorage.setItem("alarmDistance", distance);
    await AsyncStorage.setItem("alarmSound", sound);
    await AsyncStorage.setItem("alarmVolume", volume.toString());

    alert("Settings Saved");
  };

  const testAlarm = async () => {
  try {
    const { sound: alarm } = await Audio.Sound.createAsync(
      sounds[sound]
    );

    await alarm.setVolumeAsync(volume);
    await alarm.playAsync();

    alarm.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        alarm.unloadAsync();
      }
    });
  } catch (err) {
    console.log(err);
  }
};

  return (
    <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: 40 }}
  showsVerticalScrollIndicator={false}
>
      <Text style={styles.title}>Alarm Settings</Text>

      <Text style={styles.heading}>Alarm Distance</Text>

      {["500 m", "1 km", "2 km", "5 km"].map((item) => (
        <TouchableOpacity
          key={item}
          onPress={() => setDistance(item)}
          style={styles.option}
        >
          <Text style={styles.radio}>
            {distance === item ? "◉" : "○"} {item}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.heading}>Alarm Sound</Text>

      {["Bell", "Siren", "Beep", "Voice"].map((item) => (
        <TouchableOpacity
          key={item}
          onPress={() => setSound(item as keyof typeof sounds)}
          style={styles.option}
        >
          <Text style={styles.radio}>
            {sound === item ? "◉" : "○"} {item}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.heading}>
        Volume ({Math.round(volume * 100)}%)
      </Text>

      <Slider
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={setVolume}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={testAlarm}
      >
        <Text style={styles.buttonText}>Test Alarm</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={saveSettings}
      >
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop :90,
    backgroundColor: "#FFF8F0",
  },

  title: {
    paddingTop :30,
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 20,
  },

  heading: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 18,
  },

  option: {
    paddingVertical: 8,
  },

  radio: {
    fontSize: 18,
  },

  button: {
    marginTop: 25,
    backgroundColor: "#D2691E",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});