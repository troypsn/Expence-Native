import { View, Text, StyleSheet, StatusBar, TextInput, Platform, KeyboardAvoidingView, Pressable} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState} from 'react';
import Background from '../components/Background';


export default function Login() {

  const [loginDetails, setLoginDetails] = useState({
    email: '',
    password: '',
  }); 

  

  const handleFormSubmit = () => {
    // Handle form submission logic here
  }

  return (
    <Background>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
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
    
  }
});


