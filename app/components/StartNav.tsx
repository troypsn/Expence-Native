import { View, Text, StyleSheet, Pressable} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


export type GreetingProps = {
  loggedIn: boolean;
};


function StartNav({loggedIn} : GreetingProps) {
  
    const [fontsLoaded] = useFonts({
        'VCR-Mono': require('../../assets/fonts/VCR_OSD_MONO_1.001.ttf'),
    });

    if (!fontsLoaded){
        return null;
    }
    const router = useRouter();

    console.log('StartNav rendered with loggedIn:', loggedIn);
  
  
  return (
      <View style={styles.container}>

        <Pressable  onPress={()=> router.push('/main/Home')} style={{display: loggedIn ? 'flex' : 'none'}}>
          <Text style= {styles.navText}>HOME</Text>
        </Pressable>
        
        <Pressable  onPress={()=> router.push('/auth/Login')}>
          <Text style= {styles.navText}>LOGIN</Text>
        </Pressable>

        <Pressable  onPress={()=> router.push('/auth/Register')}>
          <Text style= {styles.navText}>SIGN UP</Text>
        </Pressable>

        <Pressable  onPress={()=> router.push('/main/About')}>
          <Text style= {styles.navText}>ABOUT</Text>
        </Pressable>

         <Pressable  onPress={()=> AsyncStorage.clear()}>
          <Text style= {styles.navText}>CLEAR</Text>
        </Pressable>
        
      </View>
  )
}

const styles = StyleSheet.create({
  container : {
    padding: 10,
    flex: 1, 
    alignItems: "center",
    justifyContent: "space-around",
    maxHeight: 450,

  },
   navText : {
    color: 'white',
    padding: 8,
    fontFamily: 'VCR-Mono',
    fontSize: 24,
  }
})

export default StartNav