import { View, Text, StyleSheet } from 'react-native'


function Transaction () {
  return (
    <View style={styles.container}>
        <View style={styles.icon}>

        </View>
        <View style={styles.detailsContainer}>
            <Text style={styles.name}>Transaction Name</Text>
            <Text style={styles.date}>$100.00</Text>
        </View>     
    </View>
  

  )

}

const styles = StyleSheet.create({ 
    container: {
      padding: 10,
      margin: 10,
      backgroundColor: 'lightblue',
      borderRadius: 5,
    },
    detailsContainer: {
        
    },
    icon : {

    },
    name : {

    },
    date : {

    },
  });

export default Transaction