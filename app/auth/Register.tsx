import {
  View, Text, StyleSheet, StatusBar, TextInput,
  Platform, KeyboardAvoidingView, Pressable, Alert, Keyboard, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Background from '../components/Background';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/authContext';
import { useNetwork } from '@/lib/networkContext';
import { fetchAndCacheFromSupabase, syncPendingData } from '@/lib/sync';
import { claimGuestTransactions, getGuestTransactions } from '@/lib/db';

export default function Register() {
  const router = useRouter();
  const { setLoggedIn, isGuest } = useAuth();
  const { isOnline } = useNetwork();

  const [registerDetails, setRegisterDetails] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  function formValidation() {
    const { email, password, confirmPassword } = registerDetails;
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields.', [{ text: 'OK' }], { cancelable: false });
      Keyboard.dismiss();
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address.', [{ text: 'OK' }], { cancelable: false });
      Keyboard.dismiss();
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.', [{ text: 'OK' }], { cancelable: false });
      Keyboard.dismiss();
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.', [{ text: 'OK' }], { cancelable: false });
      Keyboard.dismiss();
      return false;
    }
    Keyboard.dismiss();
    return true;
  }

  const finishRegister = async (userId: string, syncGuest: boolean) => {
    if (syncGuest) {
      await claimGuestTransactions(userId, true); // mark synced=0 so sync pushes them
    }
    if (isOnline) {
      await syncPendingData(userId);
      await fetchAndCacheFromSupabase(userId);
    }
    await setLoggedIn(userId);
    router.replace('/(tabs)/Home');
  };

  const handleRegister = async () => {
    setMessage('');
    const { data, error } = await supabase.auth.signUp({
      email: registerDetails.email,
      password: registerDetails.password,
    });

    if (error) {
      setMessage(`Server Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      const userId = data.user.id;

      // Check if there's guest data to potentially sync
      if (isGuest) {
        const guestData = await getGuestTransactions();
        if (guestData.length > 0) {
          setPendingUserId(userId);
          setShowSyncModal(true);
          setLoading(false);
          return;
        }
      }

      setMessage('Registration successful!');
      await finishRegister(userId, false);
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!formValidation()) return;
    setLoading(true);
    await handleRegister();
  };

  return (
    <Background>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.KeyboardAvoidingViewStyle}
      >
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>REGISTER</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL:</Text>
            <TextInput
              style={styles.textInput}
              value={registerDetails.email}
              onChangeText={(text) => setRegisterDetails({ ...registerDetails, email: text })}
              placeholder="Enter email"
              placeholderTextColor="#ffffff79"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD:</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              onChangeText={(text) => setRegisterDetails({ ...registerDetails, password: text })}
              placeholder="Enter password"
              placeholderTextColor="#ffffff79"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRM PASSWORD:</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              onChangeText={(text) => setRegisterDetails({ ...registerDetails, confirmPassword: text })}
              placeholder="Re-enter password"
              placeholderTextColor="#ffffff79"
            />
          </View>

          <Pressable style={styles.loginButton} onPress={handleFormSubmit}>
            <Text style={styles.loginButtonText}>REGISTER</Text>
          </Pressable>

          <ActivityIndicator size="large" color="#ffffff" style={{ display: loading ? 'flex' : 'none' }} />
          <Text style={styles.status}>{message}</Text>

          <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── Sync Guest Data Modal ── */}
      <Modal
        visible={showSyncModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSyncModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SYNC LOCAL DATA?</Text>
            <Text style={styles.modalBody}>
              You have saved transactions from before you created this account.{'\n\n'}
              Do you want to sync them to your new account in the cloud?
            </Text>

            <Pressable
              style={styles.modalButtonPrimary}
              onPress={async () => {
                setShowSyncModal(false);
                setLoading(true);
                await finishRegister(pendingUserId!, true);
                setLoading(false);
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>SYNC TO CLOUD</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonSecondary}
              onPress={async () => {
                setShowSyncModal(false);
                setLoading(true);
                await finishRegister(pendingUserId!, false);
                setLoading(false);
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>KEEP LOCAL ONLY</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  KeyboardAvoidingViewStyle: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    maxWidth: 500,
  },
  inputContainer: {
    padding: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '70%',
    marginBottom: 16,
  },
  textInput: {
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
  label: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 28,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '67%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    fontFamily: 'VCR-Mono',
    color: 'black',
    fontSize: 18,
  },
  status: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 16,
    width: '70%',
    maxWidth: 400,
    marginTop: 20,
    marginBottom: 50,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1d1d36',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalButtonPrimary: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonTextPrimary: {
    fontFamily: 'VCR-Mono',
    color: 'black',
    fontSize: 13,
  },
  modalButtonSecondary: {
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalButtonTextSecondary: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
});
