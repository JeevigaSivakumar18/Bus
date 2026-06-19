import React from 'react';
import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import {router} from 'expo-router';

export default function WelcomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.bus}>
                🚌
            </Text>

            <Text style={styles.title}>
                 Bus Alarm
            </Text>

            <Text style={styles.subtitle}>
                Sleep peacefully.
            </Text>

            <Text style={styles.subtitle}>
                We'll wake you up before your stop.
            </Text>

            <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/login')}>
                <Text style={styles.buttonText}>
                    Get Started
                </Text>
            </TouchableOpacity>

        </View> 
    );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  bus: {
    fontSize: 120,
    marginBottom: 20,
  },

  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 5,
  },

  button: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 40,
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

});

