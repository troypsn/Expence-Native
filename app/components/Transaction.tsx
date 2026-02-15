import { View, Text, StyleSheet, Image } from 'react-native'
import money from '@/assets/images/money.png'
import car from '@/assets/images/car.png'
import food from '@/assets/images/food.png'
import { useState } from 'react'


function Transaction ({name = "Default Transaction", amount = 0, date = "01/01/2024", image = "money"} : {name: string, amount: number, date: string, image: any}) {

const [transactionImage, setTransactionImage] = useState(image === "money" ? money : image === "car" ? car : food);

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.icon}>
          <Image source={image === "money" ? money : image === "car" ? car : food} style={styles.iconImage} />
        </View>

        <View style={styles.detailsContainer}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.date}>{date}</Text>
        </View>
      </View>   

        <View style={styles.rightContainer}>
            <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        </View>
    </View>
  

  )

}

const styles = StyleSheet.create({ 
    container: {
      paddingHorizontal: 20,
      paddingVertical: 30,
      margin: 10,
      backgroundColor: '#afadad28',
      borderRadius: 5 ,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      minHeight: 60,
      maxHeight: 90,
      width: '100%',
      minWidth: 250,
      maxWidth: 300,
    },
    leftContainer: {
      display: 'flex',
      flexDirection: 'row',
    },
    rightContainer: {
      marginLeft: 'auto',
    },
    detailsContainer: { 
  
      gap: 4,
      display: 'flex',
      flexDirection: 'column',
      
        
    },
    icon : {
      display: 'flex',
      height: '100%',
      justifyContent: 'center',
      alignContent: 'center',
    },
    name : {
      maxWidth: 125,
      fontSize: 15,
      color: 'white',
      fontFamily: 'VCR-Mono',
    },
    date : {
      fontSize: 10,
      color: 'white',
      fontFamily: 'VCR-Mono',
    },
    amount: {
      fontSize: 13,
      color: 'white',
      fontFamily: 'VCR-Mono',
    },
    iconImage: {
      width: 25,
      height: 25,
      marginTop: 5,
      marginRight: 18,
      marginLeft: 5,
    }
   
  });

export default Transaction