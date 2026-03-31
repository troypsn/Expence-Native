import { View, Text, StyleSheet, StatusBar, Pressable, ScrollView, Platform, RefreshControl, KeyboardAvoidingView} from 'react-native';
import Background from '../components/Background';
import { useRouter, useFocusEffect } from 'expo-router';
import Screen from '../components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Transaction from '../components/Transaction';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

function Home(){

  const insets = useSafeAreaInsets();
  const router = useRouter();
  

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("TODAY");
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);


  
  const getDateRange = (filterType: string) => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setUTCHours(23, 59, 59, 999);

    const filterTrimmed = filterType.trim();

    if (filterTrimmed === "THIS WEEK") {
      const dayOfWeek = today.getUTCDay();
      const diff = today.getUTCDate() - dayOfWeek;
      startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), diff, 0, 0, 0, 0));
      endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (filterTrimmed === "THIS MONTH") {
      startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    } else if (filterTrimmed === "THIS YEAR") {
      startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(today.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
    }

    return { startDate, endDate };
  };


  const getItems = async (filterType: string = "TODAY", isAscending: boolean = false) => {
    if (!userId) return [];
    
    let query = supabase.from('transactions').select('*').eq('user_id', userId);

    const filterTrimmed = filterType.trim();
    
    if (filterTrimmed !== "ALL TIME") {
      const { startDate, endDate } = getDateRange(filterType);
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log('Date range - Start:', startDateStr, 'End:', endDateStr);
      query = query.gte('created_at', startDateStr).lte('created_at', endDateStr);
    }

    const {data, error} = await query.order('created_at', {ascending: isAscending});
    console.log('Fetched transactions:', data, 'Filter type:', filterType, 'User ID:', userId);
    if (error) {
      console.log('Error fetching transactions:', error);
      return [];
    }
    return data;
  };

  // Handle refresh on swipe
  const handleRefresh = async () => {
    setRefreshing(true);
    const transactions = await getItems(selectedFilter, sortAscending);
    setItems(transactions);
    setRefreshing(false);
  };

  // ============ EFFECTS ============

  // Get userId from AsyncStorage on mount
  useEffect(() => {
    const getUserId = async () => {
      let id = await AsyncStorage.getItem('userId');
 
      if (id && id.startsWith('"')) {
        id = JSON.parse(id);
      }
      setUserId(id);
      console.log('User ID from storage:', id);
    };
    getUserId();
  }, []);

  // Fetch items when filter, userId, or sort order changes
  useEffect(() => {
    const fetchItems = async () => {
      const transactions = await getItems(selectedFilter, sortAscending);
      setItems(transactions);
    };
    fetchItems();
  }, [userId, selectedFilter, sortAscending]);

  // Get session
  useEffect(() => {
    const getSession = async () => {
      const result  = await supabase.auth.getSession();
      console.log('Session:', result.data.session?.access_token);
    };
    getSession();
  }, []);

  // Refresh data when screen comes into focus (e.g., after adding expense)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        const refreshData = async () => {
          const transactions = await getItems(selectedFilter, sortAscending);
          setItems(transactions);
        };
        refreshData();
      }
    }, [userId, selectedFilter, sortAscending])
  );

  // ============ RENDER ============


  return (

    <Background>
      <SafeAreaProvider style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          enabled={true}
        >
          <View style={styles.container}>
          <Text style={styles.title}>- EXPENCE -</Text>

          <Screen userId={userId} sortAscending={sortAscending} onFilterChange={setSelectedFilter} />

          <View style={styles.transactionsContainer}>
              <View style={styles.transactionsHeader}>
                <Pressable onPress={() => setSortAscending(!sortAscending)}><Text style={styles.transactionsHeaderTitle}>Transactions {sortAscending ? '🔼' : '🔽'}</Text></Pressable>
                <Pressable onPress={() => router.push('/(tabs)/Transactions')}><Text style={styles.transactionsHeaderViewAll}>View All</Text></Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            showsHorizontalScrollIndicator={false}
            style={styles.transactionsList}
            scrollEnabled={!refreshing}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor="white"
              />
            }
            >
            


            {items.map((item)=>{
              return (<Transaction key= {item.id} name={item.title} amount={item.amount} date={item.created_at} image = {item.image}/>);
            })}

            <View style={Platform.OS === 'ios' ? styles.bottomPaddingIOS : styles.bottomPaddingAndroid} />
  

          </ScrollView>

          </View>

        </View>

        
        <StatusBar 
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
                >
        </StatusBar>
        </KeyboardAvoidingView>
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
   transactionsContainer:{
    width: '100%',
    minHeight: 450,
   },

   transactionsHeader: {
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
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
    width: '100%',
    maxHeight: 500,
    maxWidth: '100%',
    minWidth: 250,
   },
   bottomPaddingIOS :{
    height: 290,
   },
  bottomPaddingAndroid:{
    paddingBottom:  100,
  }
  
})

export default Home