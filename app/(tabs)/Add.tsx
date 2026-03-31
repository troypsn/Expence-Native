import { View, Text, StyleSheet, StatusBar, TextInput, Platform, KeyboardAvoidingView, Pressable, Alert, ActivityIndicator, Keyboard, Image} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect} from 'react';
import Background from '../components/Background';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import money from '@/assets/images/money.png'
import car from '@/assets/images/car.png'
import food from '@/assets/images/food.png'

export default function Add() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [icon, setIcon] = useState("money");

  const [expenseDetails, setExpenseDetails] = useState({
    title: '',
    amount: '',
    description: '',
  });



  async function handleAddExpense() {
    const expense = {
      title: expenseDetails.title,
      amount: parseFloat(expenseDetails.amount),
      image: icon,
      description : expenseDetails.description
    };

    if (!expense.title || !expense.amount || !expense.description) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }


    console.log('Adding expense:', expense);

    let query = supabase.from('transactions').insert({user_id: userId, title: expense.title, amount: expense.amount, image: expense.image, description: expense.description});

    const { data, error } = await query;

    if (error) {
      console.log('Error adding expense:', error);
      Alert.alert('Error', 'There was an error adding the expense. Please try again.');
    } else {

    setExpenseDetails({
      title: '',
      amount: '',
      description: '',
    });

      console.log('Expense added successfully:', data);
      Alert.alert('Success', 'Expense added successfully!');
      router.push('/(tabs)/Home');
    }
    
  }





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

  
  

  return (
    <Background>

      
        <SafeAreaView style={styles.container}>
  
                <Text style={styles.title}>Add Expense</Text>

                <View style={styles.inputContainer}>

                  <Text style={styles.label}>Select Icon</Text>

                  <View style={styles.pickIcon}>
                      
                      <Pressable onPress={() => setIcon("money")} style={styles.iconContainer}> 
                        <Image source={money} style={[styles.icon, icon === "money" && styles.selectedIcon]} /> 
                      </Pressable> 
                      <Pressable onPress={() => setIcon("car")} style={styles.iconContainer}> 
                        <Image source={car} style={[styles.icon, icon === "car" && styles.selectedIcon]} /> 
                      </Pressable>
                      <Pressable onPress={() => setIcon("food")} style={styles.iconContainer}> 
                        <Image source={food} style={[styles.icon, icon === "food" && styles.selectedIcon]} /> 
                      </Pressable>

                  </View>
                  
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Title</Text>
                    <TextInput
                        placeholder="Enter Expense Title"
                        placeholderTextColor="gray"
                        style={styles.textInput}
                        onChangeText={(text) => setExpenseDetails({ ...expenseDetails, title: text})}
                    />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Amount</Text>
                    <TextInput
                        placeholder="Enter Expense Amount"
                        placeholderTextColor="gray"
                        style={styles.textInput}
                        keyboardType="numeric"
                        onChangeText={(text) => setExpenseDetails({ ...expenseDetails, amount: text})}
                    />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description</Text>
                    <TextInput
                        placeholder="Enter Expense Description"
                        placeholderTextColor="gray"
                        style={styles.textInputDescription}
                        multiline={true}
                        textAlignVertical="top"
                        onChangeText={(text) => setExpenseDetails({ ...expenseDetails, description: text})}
                    />
                </View>

                

                

                <Pressable style={styles.addButton} onPress={() => handleAddExpense()}>
                  <Text style={styles.addButtonText}>Add Expense</Text>
                </Pressable>

            <StatusBar 
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
            >
            </StatusBar>
       
 

        <Text style={styles.status}>{}</Text>

        </SafeAreaView>
  
    </Background>
  )
}


const styles = StyleSheet.create({
  container :{
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    maxWidth: 500,
  },

  KeyboardAvoidingViewStyle :{
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    maxWidth: 500,
  },

  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
  
  },
  inputContainer: {
    padding: 5,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '70%',
    marginBottom: 16,
  },
  pickIcon:{
    marginTop: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  iconContainer:{
    width: 50,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 5,
  },
  icon:{
    padding:20,
    width: 40,
    height: 40,
    margin: 10,
  },
  selectedIcon:{
    padding:10,
    width: 40,
    height: 40,
    margin: 10,
    borderColor: 'white',
    borderWidth: 1.5,
  },
  textInputDescription:{
    padding: 5,
    height: 100,
    marginBottom: 16,
    fontFamily: 'VCR-Mono',
    borderWidth: 1.5,
    borderColor: 'white',
    borderRadius: 10,
    color: 'white',
    width: 40,
    minWidth: '100%',
    overflow: 'hidden',
  },
  textInput : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    width: '100%',
    height: 45,
    borderWidth: 1.5,
    marginTop: 8,
    borderColor: 'white',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  label : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    marginBottom: 4,
  },
  title : {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
  },
  addButton : {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '67%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  addButtonText : {
    fontFamily: 'VCR-Mono',
    color: 'black',
    fontSize: 18,
    
  },
  status: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});



