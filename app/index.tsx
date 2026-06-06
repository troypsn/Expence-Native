import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Background from './components/Background';
import StartNav from './components/StartNav';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';

const Index = () => {
  const { mode, isLoggedIn, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Auto-navigate if already authenticated or was a guest
    if (mode === 'loggedIn') {
      router.replace('/(tabs)/Home');
    } else if (mode === 'guest') {
      router.replace('/(tabs)/Home');
    }
  }, [mode]);

  // Still determining persisted auth state — don't flash the landing screen
  if (mode === 'loggedIn' || mode === 'guest') return null;

  return (
    <Background>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.container}>
        <Text style={styles.title}>--EXPENCE--</Text>
        <StartNav />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
  },
});

export default Index;