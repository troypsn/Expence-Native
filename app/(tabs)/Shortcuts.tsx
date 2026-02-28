import { View, Text, StyleSheet, StatusBar, Pressable, ScrollView, Platform, FlatList} from 'react-native';
import Background from '../components/Background';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Transaction from '../components/Transaction';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function Shortcuts(){

  const insets = useSafeAreaInsets();
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

  const items = [ 
    {
      id: 1,
      name: "Grocery",
      amount: 65.23,
      date: "06/12/2024",
      image: "food",
    },
    {
      id: 2,
      name: "Commute",
      amount: 100,
      date: "06/12/2024",
      image: "car",
    },
    {
      id: 3,
      name: "Grocery",
      amount: 58.24,
      date: "06/12/2024",
      image: "food",
    },
    {
      id: 4,
      name: "Grocery",
      amount: 1000,
      date: "06/12/2024",
      image: "food",
    },
    {
      id: 5,
      name: "Frenslee Juice",
      amount: 1000,
      date: "06/12/2024",
      image: "money",
    },
    {
      id: 6,
      name: "Electricity",
      amount: 1000,
      date: "06/12/2024",
      image: "money",
    },
  ]

  return (

    <Background>
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>- EXPENCE -</Text>

          <Pressable onPress={handleScreenPress}>
              <Screen amount={2050} filter="TODAY"/>
          </Pressable>

          <View style={styles.shortcutsContainer}>
              <View style={styles.shortcutsHeader}>
                <Pressable><Text style={styles.shortcutsHeaderTitle}>Shortcuts</Text></Pressable>
                <Pressable><Text style={styles.shortcutsHeaderViewAll}>View All</Text></Pressable>
              </View>

          <View style={styles.shortcutsList}>
            {
            //Fix Alot of  this stuff, renames transactions to shortcuts, resize shortcuts to boxes //
            }
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.shortcutsList}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => (
                <Transaction name={item.name}amount={item.amount}date={item.date}image={item.image} />
              )}
            />
          </View>

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
   shortcutsContainer:{
    width: '100%',
    minHeight: 450,
   },

  shortcutsHeader: {
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
  shortcutsHeaderTitle: {
    fontFamily: 'VCR-Mono',
    fontSize: 13,
    color: 'white',
   },
   shortcutsHeaderViewAll: {
    fontFamily: 'VCR-Mono',
    fontSize: 13,
    color: 'white',
   },
    shortcutsList: {
    

    width: '100%',
    maxHeight: 500,
    maxWidth: '100%',
    minWidth: 250,
   },
   row:{
    justifyContent: 'space-between',
    marginBottom: 15,
   },
   bottomPaddingIOS :{
    height: 290,
   },
  bottomPaddingAndroid:{
    paddingBottom: 100,
  }
  
})

export default Shortcuts