import { View, Text, StyleSheet, StatusBar, TextInput, Platform, KeyboardAvoidingView, Pressable, Alert, ActivityIndicator, Keyboard} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState} from 'react';
import Background from '../components/Background';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';


export default function Login() {

  const router = useRouter();

  const [loginDetails, setLoginDetails] = useState({
    email: '',
    password: '',
  }); 

  const [message, setMessage] = useState('');
  
  const[loading, setLoading] = useState(false);

  const showErrorAlert = (title : string, message : string) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
      { cancelable: false } 
    );
  }

  const validateForm = () => {
    if (loginDetails.email.trim() === '' || loginDetails.password.trim() === '') {
      showErrorAlert('Error', 'Please fill in all fields.');
      return false;
    }
    else {
      return true;
    }
  }

  const handleLogin = async () => {
    console.log('Login details:', loginDetails);
        setMessage(''); // clear previous messages
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginDetails.email,
          password: loginDetails.password,
        });
    
        if (error) {
          console.log(`Server Error: ${error.message}`);
          setMessage(`Server Error: ${error.message}`);
          setLoading(false);
          return;
        }
    
        if (data.user) {
          console.log(`Success! User ID: ${data.user.id}`);
          console.log('Login user:', data.user);
          setMessage('Login Successful! Redirecting...');
          setLoading(false);
          AsyncStorage.setItem('loggedIn', JSON.stringify(data.user));
          router.replace("/(tabs)/Home");
        }
      
  }

  const handleFormSubmit = async () => {
    Keyboard.dismiss();
    const isValid = validateForm();
    if (isValid) {
      setLoading(true);
      await handleLogin();
    } 
  }

  return (
    <Background>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.KeyboardAvoidingViewStyle}>
        <SafeAreaView style={styles.container}>
  
                <Text style={styles.title}>LOGIN</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL:</Text>
                  <TextInput style={styles.textInput} 
                  value={loginDetails.email}
                  onChangeText={(text) => setLoginDetails({...loginDetails, email: text})}
                  placeholder="Enter email"
                  placeholderTextColor="#ffffff79" 
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>PASSWORD:</Text>
                  <TextInput  style={styles.textInput} secureTextEntry 
                  onChangeText={(text) => setLoginDetails({...loginDetails, password: text})}
                  placeholder="Enter password"
                  placeholderTextColor="#ffffff79" 
                  />
                </View>

                <Pressable style={styles.loginButton} onPress={handleFormSubmit}>
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                </Pressable>

            <StatusBar 
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
            >
            </StatusBar>
       
        <ActivityIndicator animating={loading} color="#ffffff" size="large" />

        <Text style={styles.status}>{message}</Text>

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
    marginBottom: 50,
  },
  loginButtonText : {
    fontFamily: 'VCR-Mono',
    color: 'black',
    fontSize: 18,
    
  },
  status: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});



