import { View, Text, StyleSheet, StatusBar} from 'react-native';
import Background from '../components/Background';
import StartNav from '../components/StartNav';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';


const Landing = () => {
  const router = useRouter();
  
  return (

    <Background>
              <StatusBar 
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
              >
            </StatusBar>
      <View style={styles.container}>
        <Text style={styles.title}>--EXPENCE--</Text>
       {
       // temporary true, check async storage if a user token is stored. If so, set to true, else false.
       }
        <StartNav loggedIn={true} />
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  container : {
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
    fontSize: 28,
    marginBottom: 20,
   }
})

export default Landing