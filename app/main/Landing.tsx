import { View, Text, StyleSheet, StatusBar} from 'react-native';
import Background from '../components/Background';
import StartNav from '../components/StartNav';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';


const Landing = () => {
  
  const [loggedIn, setLoggedIn] = useState(false);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    if (session) {
      setLoggedIn(true);
    }
  };

  useEffect(() => {
  checkSession();
}, []);
  
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

        <StartNav loggedIn={loggedIn} />
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