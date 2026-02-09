import { View, Text, StyleSheet, StatusBar} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

function Home(){
  const router = useRouter();
  

  return (

    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>- EXPENCE -</Text>
       <Screen></Screen>
      </View>




      <StatusBar 
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
              >
      </StatusBar>
    </Background>
  )
}

const styles = StyleSheet.create({
  container : {
    width: '100%',
    borderBlockColor: 'red',
    borderWidth: 2,
    flex: 1, 
    alignItems: "center",
    justifyContent: "center",
    
  },
   button : {
    color: 'blue',
    padding: 10,
   },
   title : {
    width: '100%',
    textAlign: 'center',
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 15,
    marginBottom: 20,
   },
  
})

export default Home