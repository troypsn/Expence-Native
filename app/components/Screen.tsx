import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native'


function Screen(props: { amount: number, filter: string }) {
    
    useEffect(() => {
        
        console.log('Screen component mounted with props:', props);
    }, [props]);

  return (
        <View style={styles.container}>
            <Text style={styles.header}>TOTAL COST</Text>
            <Text style={styles.filter}>:TODAY</Text>
            <Text style={styles.amount}>{props.amount}</Text>
        </View>
  )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#afadad28',

        width: 300,
        minWidth: 250,
        maxWidth: 300,
        borderBlockColor: 'black',
        borderWidth: 2,

        height: '30%',
        minHeight: 150,
        maxHeight: 200,
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