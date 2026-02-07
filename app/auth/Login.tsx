import { View, Text, StyleSheet, StatusBar, TextInput, Platform, KeyboardAvoidingView, ScrollView} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
       <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          
          <Text>Login Screen</Text>

          <View style={styles.inputContainer}>
            <Text>Email:</Text>
            <TextInput style={styles.textInput} />
          </View>

          <View style={styles.inputContainer}>
            <Text>Password:</Text>
            <TextInput  style={styles.textInput} secureTextEntry />
          </View>
          
          <StatusBar></StatusBar>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container :{
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: StatusBar.currentHeight,
  },
  inputContainer: {

    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,

    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '80%',
    marginBottom: 16,
  },
  textInput : {
    width: '100%',
    height: 40,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  }
});


