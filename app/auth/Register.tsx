import { View, Text, StyleSheet, StatusBar, TextInput, Platform, KeyboardAvoidingView, Pressable, Alert, Keyboard, ActivityIndicator} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect} from 'react';
import Background from '../components/Background';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';




export default function Register() {
 


  const showErrorAlert = (title : string, message : string) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
    { cancelable: false } // Prevents dismissing by tapping outside on Android
  );
};

  const [registerDetails, setRegisterDetails] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  }); 

  const [loading, setLoading] = useState(false);

   const [message, setMessage] = useState('');


  function checkIfSamePassword(password: string, confirmPassword: string) {
    if (password === confirmPassword){
      return true;  
    } else {
      return false;
    }
  }

  function checkIfEmptyFields(input: string) {
    if (input.trim() === ''){
      return true;
    } else {
      return false;
    }
  }

  function formValidation() {
      if (checkIfEmptyFields(registerDetails.email) || checkIfEmptyFields(registerDetails.password) || checkIfEmptyFields(registerDetails.confirmPassword)){
      Alert.alert(
        'Error',
        'Please fill in all fields.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );

      Keyboard.dismiss()

      return false;
    } 
    else if (registerDetails.email.indexOf('@') === -1 || registerDetails.email.indexOf('.') === -1){
      Alert.alert(
        'Error',
        'Please enter a valid email address.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );

      Keyboard.dismiss()

       return false;

    } else if (registerDetails.password.length < 6){
      Alert.alert(
        'Error',
        'Password must be at least 6 characters long.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
      );

      Keyboard.dismiss()

       return false;

    } else if (!checkIfSamePassword(registerDetails.password, registerDetails.confirmPassword)){
      Alert.alert(
        'Error',
        'Passwords do not match.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
        { cancelable: false }
        
      );

      Keyboard.dismiss()

       return false;

    } else {
      Keyboard.dismiss()
      setLoading(true);
       return true;
    }
  }

  const handleRegister = async () => {
    setMessage(''); // clear previous messages
    const { data, error } = await supabase.auth.signUp({
      email: registerDetails.email,
      password: registerDetails.password,
    });

    if (error) {
      console.log(`Server Error: ${error.message}`);
      setMessage(`Server Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      console.log(`Success! User ID: ${data.user.id}`);
      console.log('Registered user:', data.user);
      setMessage('Registration successful! you can know Login.');
      setLoading(false);
    } 
  };


  const handleFormSubmit = async () => {
    console.log(registerDetails);
    const isValid = formValidation();
    if (isValid) {
      await handleRegister();
    }
  }

  return (
    <Background>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.KeyboardAvoidingViewStyle}>

        <SafeAreaView style={styles.container}>

                <Text style={styles.title}>REGISTER</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL:</Text>

                  <TextInput style={styles.textInput} 
                  value={registerDetails.email}
                  onChangeText={(text) => setRegisterDetails({...registerDetails, email: text})}
                  placeholder="Enter email"
                  placeholderTextColor="#ffffff79" 
                  />

                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>PASSWORD:</Text>
                  <TextInput  style={styles.textInput} secureTextEntry 
                  onChangeText={(text) => setRegisterDetails({...registerDetails, password: text})}
                  placeholder="Enter password"
                  placeholderTextColor="#ffffff79" 
                  />

                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>CONFIRM PASSWORD:</Text>

                  <TextInput  style={styles.textInput} secureTextEntry 
                  onChangeText={(text) => setRegisterDetails({...registerDetails, confirmPassword: text})}
                  placeholder="Re-enter password"
                  placeholderTextColor="#ffffff79" 
                  />

                </View>

                <Pressable style={styles.loginButton} onPress={handleFormSubmit}>
                  <Text style={styles.loginButtonText}>REGISTER</Text>
                </Pressable>

                <ActivityIndicator size="large" color="#ffffff" style={{display: loading ? 'flex' : 'none'}}/>
                <Text style={styles.status}>{message}</Text>
            
            <StatusBar 
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
            >
            </StatusBar>

       
        
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Background>
  )
}

const styles = StyleSheet.create({
  container :{
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },

    KeyboardAvoidingViewStyle :{
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    maxWidth: 500,
  },
  
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
  
  },
  inputContainer: {
    padding: 5,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '70%',
    marginBottom: 16,
  },
  textInput : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    width: '100%',
    height: 45,
    borderWidth: 1.5,
    marginTop: 8,
    borderColor: 'white',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  label : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    marginBottom: 4,
  },
  title : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
  },
  loginButton : {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '67%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  loginButtonText : {
    fontFamily: 'VCR-Mono',
    color: 'black',
    fontSize: 18,
    
  },
  status : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 16,
    width: '70%',
    maxWidth: 400,
    marginTop: 20,
    marginBottom: 50,
  }
})


