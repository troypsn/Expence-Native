import { View, Text, StyleSheet, StatusBar, Pressable, ScrollView} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Transaction from '../components/Transaction';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>- EXPENCE -</Text>

          <Pressable onPress={handleScreenPress}>
              <Screen amount={2050} filter="TODAY"/>
          </Pressable>

          <View style={styles.transactionsContainer}>
              <View style={styles.transactionsHeader}>
                <Pressable><Text style={styles.transactionsHeaderTitle}>Transactions</Text></Pressable>
                <Pressable><Text style={styles.transactionsHeaderViewAll}>View All</Text></Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            showsHorizontalScrollIndicator={false}
            style={styles.transactionsList}>

              <Transaction name="Grocery Shopping" amount={45.75} date="06/12/2024" image = "food" />
              <Transaction name="Commute" amount={100} date="06/12/2024" image = "car" />
              <Transaction name="Pagkain ni Frenslee" amount={45.75} date="06/12/2024" image = "money" />
              

          </ScrollView>

          </View>

        </View>

        
        <StatusBar 
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
                >
        </StatusBar>
      </SafeAreaProvider>
    </Background>
  )
}

const styles = StyleSheet.create({
  container : {
    paddingTop: "13%",
    width: '100%',
    borderBlockColor: 'red',
    borderWidth: 2,
    flex: 1, 
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 250,
    maxWidth: 400,
    alignSelf: 'center',
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
    borderBlockColor: 'blue',
    borderWidth: 2,
    width: '100%',
    minHeight: 450,
   },

   transactionsHeader: {
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    color: '#FFFFFF',
    width: '100%',
    minWidth: 250,
    maxWidth: 300,
   },
   transactionsHeaderTitle: {
    fontFamily: 'VCR-Mono',
    fontSize: 13,
    color: 'white',
   },
   transactionsHeaderViewAll: {
    fontFamily: 'VCR-Mono',
    fontSize: 13,
    color: 'white',
   },
   transactionsList: {
    display: 'flex',
    alignContent: 'center',
    flexDirection: 'column',
    borderBlockColor: 'green',
    borderWidth: 2,
    width: '100%',
    maxHeight: 400,
    maxWidth: '100%',
    minWidth: 250,
   }
  
})

export default Home