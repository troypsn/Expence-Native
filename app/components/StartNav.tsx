import { View, Text, StyleSheet, Pressable} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';


const StartNav = () => {
    const [fontsLoaded] = useFonts({
        'VCR-Mono': require('../../assets/fonts/VCR_OSD_MONO_1.001.ttf'),
    });

    if (!fontsLoaded){
        return null;
    }
    const router = useRouter();

  
  
  
  return (
      <View style={styles.container}>
        
        <Pressable  onPress={()=> router.push('/auth/Login')}>
          <Text style= {styles.navText}>Login</Text>
        </Pressable>

        <Pressable  onPress={()=> router.push('/auth/Register')}>
          <Text style= {styles.navText}>Sign Up</Text>
        </Pressable>

        <Pressable  onPress={()=> router.push('/main/About')}>
          <Text style= {styles.navText}>About</Text>
        </Pressable>
        
      </View>
  )
}

const styles = StyleSheet.create({
  container : {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    flex: 1, 
    alignItems: "center",
    justifyContent: "space-around",
    maxHeight: 450,

  },
   navText : {
    color: 'white',
    padding: 10,
    fontFamily: 'VCR-Mono',
    fontSize: 24,
  }
})

export default StartNav