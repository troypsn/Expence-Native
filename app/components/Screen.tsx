import { View, Text, Pressable, StyleSheet } from 'react-native'


function Screen() {
    function toggleTimeFilter(){
        //insert code to toggle time filter here
        console.log('toggle time filter')
    }
  return (
    <Pressable onPress={() => toggleTimeFilter}>
        <View style={styles.container}>
            <Text style={styles.header}>TOTAL COST</Text>
            <Text style={styles.filter}>:TODAY</Text>
            <Text style={styles.amount}>2050</Text>
        </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#afadad28',

        width: 'auto',
        minWidth: 250,
        maxWidth: 400,
        borderBlockColor: 'black',
        borderWidth: 2,

        height: '30%',
        minHeight: 150,
        maxHeight: 300,
        gap: '2%',
    },
    header: {
        fontFamily: 'VCR-Mono',
        fontSize: 12,
        color: 'white',
        marginBottom: 5,
    },
    amount: {
        fontFamily: 'VCR-Mono',
        fontSize: 30,
        color: 'white',
        marginBottom: 15,
    },
    filter: {
        fontFamily: 'VCR-Mono',
        fontSize: 10,
        color: 'white',
    }
});

export default Screen