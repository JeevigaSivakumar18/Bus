import React,{useState} from 'react';
import { View,Text,TextInput,TouchableOpacity,StyleSheet , } from "react-native";

import {router} from 'expo-router';

import API from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function LoginScreen(){
    const [email,setEmail] = useState('');
    const [password , setPassword] = useState('');

const handleLogin = async () => {
  try {

    const res = await API.post("/users/login", {
      email,
      password,
    });

    const { token, user } = res.data;

await AsyncStorage.setItem("token", token);

await AsyncStorage.setItem(
  "user",
  JSON.stringify(user)
);

alert("Login Successful");

router.replace("/home");

  } catch (err:any) {

    alert(
      err.response?.data?.message ||
      "Login Failed"
    );

  }
};

    return(
        <View style={styles.container}>
          <Text style={styles.title}>
            Bus Alarm Login Screen
          </Text>

          <Text style={styles.subtitle}>
            Wakey wakey its time to wake up
          </Text>

          <TextInput
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            />

            <TextInput
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            />
            <TouchableOpacity style={styles.loginButton}
            onPress={handleLogin}>
                <Text style={styles.buttonText}>
                    Login
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
             onPress={() => router.push('/signup')}>
                <Text style={styles.signupText}>
                    Don't have an account? Sign Up
                </Text>
            </TouchableOpacity>

        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex : 1,
        backgroundColor: "#FFF8F0",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#A0522D",
    marginBottom: 40,
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,

    borderWidth: 1,
    borderColor: "#D2B48C",
  },

  loginButton: {
    backgroundColor: "#D2691E",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  signupText: {
    marginTop: 20,
    textAlign: "center",
    color: "#8B4513",
    fontWeight: "600",
  },

}
)


