import { View, Text, StyleSheet, Image, Animated, Pressable } from 'react-native'
import money from '@/assets/images/money.png'
import car from '@/assets/images/car.png'
import food from '@/assets/images/food.png'
import { useState, useRef } from 'react'
import { Swipeable, RectButton } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr}: ${timeStr}`;
};

type TransactionProps = {
  name: string;
  amount: number;
  date: string;
  image: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
};

function Transaction({ name, amount, date, image, onEdit, onDelete, onPress }: TransactionProps) {
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeWillOpen = () => {
    Animated.timing(actionOpacity, {
      toValue: 1,
      duration: 150,
      delay: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleSwipeWillClose = () => {
    Animated.timing(actionOpacity, {
      toValue: 0,
      duration: 10,
      useNativeDriver: true,
    }).start();
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [-20, 0, 0, 1],
    });
    return (
      <RectButton style={styles.leftActionBase} onPress={() => { swipeableRef.current?.close(); onEdit?.(); }}>
        <Animated.View style={[styles.leftActionContent, { opacity: actionOpacity }]}>
          <Animated.View style={{ transform: [{ translateX: trans }] }}>
            <Ionicons name="pencil" size={24} color="white" />
          </Animated.View>
        </Animated.View>
      </RectButton>
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-101, -100, -50, 0],
      outputRange: [-1, 0, 0, 20],
    });
    return (
      <RectButton style={styles.rightActionBase} onPress={() => { swipeableRef.current?.close(); onDelete?.(); }}>
        <Animated.View style={[styles.rightActionContent, { opacity: actionOpacity }]}>
          <Animated.View style={{ transform: [{ translateX: trans }] }}>
            <Ionicons name="trash" size={24} color="white" />
          </Animated.View>
        </Animated.View>
      </RectButton>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={onEdit ? renderLeftActions : undefined}
      renderRightActions={onDelete ? renderRightActions : undefined}
      onSwipeableWillOpen={handleSwipeWillOpen}
      onSwipeableWillClose={handleSwipeWillClose}
      friction={2}
      leftThreshold={30}
      rightThreshold={40}
    >
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && onPress && { opacity: 0.7 }
        ]}
      >
        <View style={styles.leftContainer}>
          <View style={styles.icon}>
            <Image source={image === "money" ? money : image === "car" ? car : food} style={styles.iconImage} />
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.date}>{formatDate(date)}</Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        </View>
      </Pressable>
    </Swipeable>
  )

}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#afadad28',
    borderRadius: 5,
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
  icon: {
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
  },
  name: {
    maxWidth: 125,
    fontSize: 15,
    color: 'white',
    fontFamily: 'VCR-Mono',
  },
  date: {
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
    marginTop: 0,
    marginRight: 18,
    marginLeft: 5,
  },
  leftActionBase: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 5,
    marginLeft: 10,
    borderRadius: 5,
    width: 80,
    overflow: 'hidden',
  },
  leftActionContent: {
    backgroundColor: '#f59e0b', // Orange for edit
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionBase: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 5,
    marginRight: 10,
    borderRadius: 5,
    width: 80,
    overflow: 'hidden',
  },
  rightActionContent: {
    backgroundColor: '#ef4444', // Red for delete
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    paddingHorizontal: 15,
  },

});

export default Transaction
