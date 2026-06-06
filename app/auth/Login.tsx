import {
  View, Text, StyleSheet, StatusBar, TextInput,
  Platform, KeyboardAvoidingView, Pressable, Alert, ActivityIndicator, Keyboard, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Background from '../components/Background';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/authContext';
import { useNetwork } from '@/lib/networkContext';
import { fetchAndCacheFromSupabase, syncPendingData } from '@/lib/sync';
import { claimGuestTransactions, getGuestTransactions } from '@/lib/db';

export default function Login() {
  const router = useRouter();
  const { setLoggedIn, isGuest } = useAuth();
  const { isOnline } = useNetwork();

  const [loginDetails, setLoginDetails] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [hasGuestData, setHasGuestData] = useState(false);

  const validateForm = () => {
    if (!loginDetails.email.trim() || !loginDetails.password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return false;
    }
    return true;
  };

  const finishLogin = async (userId: string, mergeGuest: boolean) => {
    // Claim guest data if user chose to merge
    if (mergeGuest) {
      await claimGuestTransactions(userId, true); // mark synced=0 so sync pushes them
    }

    // Cache remote data locally first
    if (isOnline) {
      await fetchAndCacheFromSupabase(userId);
      // Then push any local pending items (including merged guest data)
      await syncPendingData(userId);
    }

    await setLoggedIn(userId);
    router.replace('/(tabs)/Home');
  };

  const handleLogin = async () => {
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDetails.email,
      password: loginDetails.password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user) {
      const userId = data.user.id;

      // Check if there's guest data to potentially merge
      if (isGuest) {
        const guestData = await getGuestTransactions();
        if (guestData.length > 0) {
          setPendingUserId(userId);
          setHasGuestData(true);
          setShowMergeModal(true);
          setLoading(false);
          return;
        }
      }

      setMessage('Login Successful! Redirecting...');
      await finishLogin(userId, false);
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    setLoading(true);
    await handleLogin();
  };

  return (
    <Background>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.KeyboardAvoidingViewStyle}
      >
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>LOGIN</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL:</Text>
            <TextInput
              style={styles.textInput}
              value={loginDetails.email}
              onChangeText={(text) => setLoginDetails({ ...loginDetails, email: text })}
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
              onChangeText={(text) => setLoginDetails({ ...loginDetails, password: text })}
              placeholder="Enter password"
              placeholderTextColor="#ffffff79"
            />
          </View>

          <Pressable style={styles.loginButton} onPress={handleFormSubmit}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </Pressable>

          <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
          <ActivityIndicator animating={loading} color="#ffffff" size="large" />
          <Text style={styles.status}>{message}</Text>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── Merge Modal ── */}
      <Modal
        visible={showMergeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMergeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>MERGE LOCAL DATA?</Text>
            <Text style={styles.modalBody}>
              You have locally saved transactions from before you logged in.{'\n\n'}
              Do you want to merge them into your account?
            </Text>

            <Pressable
              style={styles.modalButtonPrimary}
              onPress={async () => {
                setShowMergeModal(false);
                setLoading(true);
                await finishLogin(pendingUserId!, true);
                setLoading(false);
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>MERGE INTO ACCOUNT</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonSecondary}
              onPress={async () => {
                setShowMergeModal(false);
                setLoading(true);
                await finishLogin(pendingUserId!, false);
                setLoading(false);
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>DISCARD LOCAL DATA</Text>
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
    marginBottom: 50,
  },
  loginButtonText: {
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
