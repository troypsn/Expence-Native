import {
  View, Text, StyleSheet, StatusBar, Pressable,
  ScrollView, Platform, RefreshControl, KeyboardAvoidingView, Modal, Alert, LayoutAnimation, UIManager
} from 'react-native';
import Background from '../components/Background';
import { useRouter, useFocusEffect } from 'expo-router';
import Transaction from '../components/Transaction';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { getShortcuts, deleteShortcut, insertTransaction } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useNetwork } from '@/lib/networkContext';
import ConfirmationModal from '../components/ConfirmationModal';

function Shortcuts() {
  const router = useRouter();
  const { userId, isLoggedIn, isGuest } = useAuth();
  const { isOnline } = useNetwork();

  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUseShortcut = async (item: any) => {
    if (loading) return;
    setLoading(true);

    const now = new Date().toISOString();
    try {
      const localId = await insertTransaction({
        remote_id: null,
        user_id: userId,
        title: item.title,
        amount: item.amount,
        image: item.image,
        description: item.description || 'Shortcut usage',
        created_at: now,
        synced: 0,
        is_guest: isGuest ? 1 : 0,
      });

      // Background sync
      if (isLoggedIn && isOnline && userId) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                title: item.title,
                amount: item.amount,
                image: item.image,
                description: item.description || 'Shortcut usage',
                created_at: now
              })
              .select('transaction_id')
              .single();

            if (!error && data?.transaction_id) {
              const { markTransactionSynced } = await import('@/lib/db');
              await markTransactionSynced(localId, data.transaction_id);
            }
          } catch (e) {
            console.warn('[shortcuts] Sync failed:', e);
          }
        })();
      }

      Alert.alert('Success', `Added ${item.title} to transactions!`);
      router.replace('/(tabs)/Home');
    } catch (e) {
      Alert.alert('Error', 'Failed to add transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Show login prompt immediately when guest arrives on this tab
  useEffect(() => {
    if (isGuest) {
      setShowLoginModal(true);
    }
  }, [isGuest]);

  const loadShortcuts = useCallback(
    async (ascending: boolean = false) => {
      if (!isLoggedIn || !userId) return [];
      return getShortcuts(userId, ascending);
    },
    [userId, isLoggedIn]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const rows = await loadShortcuts(sortAscending);
    setItems(rows);
    setRefreshing(false);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;

    const shortcutToDelete = items.find(i => i.local_id === itemToDelete);

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    // ─── Remote Deletion ───
    if (isLoggedIn && isOnline && shortcutToDelete?.remote_id) {
      try {
        const { error } = await supabase
          .from('shortcuts')
          .delete()
          .eq('shortcut_id', shortcutToDelete.remote_id);

        if (error) console.warn('[shortcuts] Remote delete failed:', error.message);
      } catch (e) {
        console.warn('[shortcuts] Remote delete error:', e);
      }
    }

    await deleteShortcut(itemToDelete);
    const rows = await loadShortcuts(sortAscending);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems(rows);
    setItemToDelete(null);
  };

  const handleEdit = (item: any) => {
    Alert.alert("Edit", `Edit feature for ${item.title} coming soon!`);
  };

  useEffect(() => {
    loadShortcuts(sortAscending).then(setItems);
  }, [userId, sortAscending]);

  useFocusEffect(
    useCallback(() => {
      loadShortcuts(sortAscending).then(setItems);
    }, [userId, isLoggedIn, sortAscending])
  );

  return (
    <Background>
      <SafeAreaProvider style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} enabled>
          <View style={styles.container}>
            <Text style={styles.title}>- SHORTCUTS -</Text>

            <View style={styles.transactionsContainer}>
              <View style={styles.transactionsHeader}>
                <Pressable onPress={() => setSortAscending(!sortAscending)}>
                  <Text style={styles.transactionsHeaderTitle}>
                    Shortcuts {sortAscending ? '🔼' : '🔽'}
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                style={styles.transactionsList}
                scrollEnabled={!refreshing}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="white" />
                }
              >
                {items.length === 0 && isLoggedIn ? (
                  <Text style={styles.emptyText}>No shortcuts yet — add one from the + tab</Text>
                ) : null}

                {items.map((item) => (
                  <Transaction
                    key={item.local_id}
                    name={item.title}
                    amount={item.amount}
                    date={item.created_at}
                    image={item.image}
                    onDelete={() => setItemToDelete(item.local_id)}
                    onEdit={() => handleEdit(item)}
                    onPress={() => handleUseShortcut(item)}
                  />
                ))}
                <View style={Platform.OS === 'ios' ? styles.bottomPaddingIOS : styles.bottomPaddingAndroid} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        <ConfirmationModal
          visible={itemToDelete !== null}
          title="DELETE SHORTCUT?"
          body="Are you sure you want to delete this shortcut?"
          confirmText="DELETE"
          onConfirm={confirmDelete}
          onCancel={() => setItemToDelete(null)}
          danger
        />

        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      </SafeAreaProvider>

      {/* ── Login Required Modal ── */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowLoginModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LOGIN REQUIRED</Text>
            <Text style={styles.modalBody}>
              Shortcuts are synced to the cloud and require an account.{'\n\n'}
              Log in or sign up to use this feature.
            </Text>

            <Pressable
              style={styles.modalButtonPrimary}
              onPress={() => {
                setShowLoginModal(false);
                router.push('/auth/Login');
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>LOGIN</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonOutline}
              onPress={() => {
                setShowLoginModal(false);
                router.push('/auth/Register');
              }}
            >
              <Text style={styles.modalButtonTextOutline}>SIGN UP</Text>
            </Pressable>

            <Pressable
              style={styles.modalButtonGhost}
              onPress={() => {
                setShowLoginModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonTextGhost}>MAYBE LATER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: '13%',
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 250,
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 15,
    marginBottom: 20,
  },
  transactionsContainer: {
    width: '100%',
    minHeight: 450,
  },
  transactionsHeader: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    width: '100%',
    minWidth: 250,
    maxWidth: 300,
  },
  transactionsHeaderTitle: {
    fontFamily: 'VCR-Mono',
    fontSize: 13,
    color: 'white',
  },
  transactionsList: {
    flexDirection: 'column',
    width: '100%',
    maxHeight: 500,
    minWidth: 250,
  },
  emptyText: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  bottomPaddingIOS: {
    height: 290,
  },
  bottomPaddingAndroid: {
    paddingBottom: 100,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1d1d36',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 20,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 14,
  },
  modalButtonOutline: {
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  modalButtonTextOutline: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 14,
  },
  modalButtonGhost: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonTextGhost: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});

export default Shortcuts;