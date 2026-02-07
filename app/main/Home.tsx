import { View, Text, StyleSheet, Pressable} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';

const Home = () => {
  const router = useRouter();
  
  return (
    <Background>
      <View style={styles.container}>
        <Text>HomeScreen</Text>
        
        <Pressable  onPress={()=> router.push('/auth/Login')}>
          <Text style= {styles.button}>Go To Login</Text>
        </Pressable>
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
  }
})

export default Home