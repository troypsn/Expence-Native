import { View, Text, StyleSheet, StatusBar, Pressable} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

function Home(){
  const router = useRouter();

  console.log(AsyncStorage.getItem('loggedIn'));
  console.log('Home rendered');
  
  const getSession = async () => {
    const result  = await supabase.auth.getSession();
    console.log('Session:', result.data.session?.access_token);
  }
  getSession();

  function handleScreenPress() {
    console.log('Screen pressed');
    //insert logic to filter through expenses,
    //depending on filter, fetch by day, week, month, year and pass the total amount to the Screen component as a prop
    //insert logic to fetch total expense amount for the day and pass it to the Screen component as a prop
  }


  return (

    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>- EXPENCE -</Text>
          <Pressable onPress={handleScreenPress}>
            <Screen amount={2050} filter="TODAY"/>
        </Pressable>
      </View>

      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          
        </View>
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
   transactionsContainer:{

   },

   transactionsHeader: {
    
   },
   
  
})

export default Home