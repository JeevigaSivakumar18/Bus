import React , {useState} from 'react';
import{
    View, 
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

export default function SignupScreen(){
     const [name , setName] = useState('');
     const [email,setEmail] = useState('');
     const[password,setPassword] = useState(''); 
     const[confirmPassword , setConfirmPassword] = useState('');

     return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Create an account
            </Text>

             <Text style={styles.subtitle}>
                 Start your journey with Bus Alarm
              </Text>

              <TextInput
              placeholder='Name'
              value={name}
              onChangeText={setName}
              style={styles.input}/>

              <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}/>

              <TextInput
              placeholder='Password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}/>

                <TextInput
                placeholder='Confirm Password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                />

                <TouchableOpacity style={styles.signupButton}>
                   <Text style={styles.buttonText}>
                    Sign Up
                   </Text>
                    </TouchableOpacity> 

                    <TouchableOpacity>
        <Text style={styles.loginText}>
          Already have an account? Login
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
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B4513',
    marginBottom: 10,
  },

  subtitle: {
    textAlign: 'center',
    color: '#A0522D',
    marginBottom: 35,
    fontSize: 15,
  },

  input: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D2B48C',
  },

  signupButton: {
    backgroundColor: '#D2691E',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },

  loginText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#8B4513',
    fontWeight: '600',
  },

 }
);
