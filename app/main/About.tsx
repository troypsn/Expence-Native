import { View, Text, StyleSheet, Pressable} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';

const About = () => {
  const router = useRouter();
  
  return (
      <View style={styles.container}>
        <Text>About Screen</Text>
      </View>
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

export default About