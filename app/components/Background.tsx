// app/components/Background.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Background({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Solid base color */}
      <View style={styles.base} />

      {/* Vignette effect */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
        style={styles.vignette}
        locations={[0, 0.5, 1]}
      />

      {/* Screen content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060394', // nice deep blue
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});