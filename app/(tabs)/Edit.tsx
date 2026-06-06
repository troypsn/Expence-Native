import {
  View, Text, StyleSheet, StatusBar, Pressable,
  ScrollView, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Background from '../components/Background';
import { useAuth } from '@/lib/authContext';
import { useNetwork } from '@/lib/networkContext';
import { syncPendingData, fetchAndCacheFromSupabase } from '@/lib/sync';
import { getDb } from '@/lib/db';
import { Image, ImageSourcePropType } from 'react-native';

import phoneIcon from '@/assets/images/phone.png';
import doorIcon from '@/assets/images/door.png';
import trashcanIcon from '@/assets/images/trashcan.png';
import cloudIcon from '@/assets/images/cloud.png';
import aboutIcon from '@/assets/images/about.png';

import { supabase } from '@/lib/supabase';

export default function Edit() {
  const router = useRouter();
  const { isLoggedIn, isGuest, userId, logout } = useAuth();
  const { isOnline } = useNetwork();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearOnlineModal, setShowClearOnlineModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'LOG OUT',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    if (!isLoggedIn || !userId) {
      Alert.alert('Login Required', 'You need to be logged in to sync data.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Offline', 'No internet connection. Sync will happen automatically when online.');
      return;
    }
    setSyncing(true);
    setSyncMsg('');
    try {
      await syncPendingData(userId);
      await fetchAndCacheFromSupabase(userId);
      setSyncMsg('✓ Synced!');
    } catch {
      setSyncMsg('✗ Sync failed. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLocalData = async () => {
    const db = await getDb();
    if (isGuest) {
      await db.runAsync(`DELETE FROM transactions WHERE is_guest = 1`);
    } else {
      await db.runAsync(`DELETE FROM transactions WHERE user_id = ?`, [userId]);
      await db.runAsync(`DELETE FROM shortcuts WHERE user_id = ?`, [userId]);
    }
    setShowClearModal(false);
    Alert.alert('Done', 'Local data cleared.');
  };

  const handleClearOnlineData = async () => {
    if (!isLoggedIn || !userId) return;
    if (!isOnline) {
      Alert.alert('Offline', 'Need internet to clear online data.');
      return;
    }

    try {
      // Clear transactions
      const { error: tError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId);
      
      // Clear shortcuts
      const { error: sError } = await supabase
        .from('shortcuts')
        .delete()
        .eq('user_id', userId);

      if (tError || sError) throw new Error('Delete failed');

      setShowClearOnlineModal(false);
      Alert.alert('Done', 'Your cloud database has been cleared.');
    } catch (e) {
      Alert.alert('Error', 'Could not clear online data. Please try again.');
    }
  };

  // ─── Reusable row matching the Transaction card aesthetic ─────────────────

  const Row = ({
    icon, label, sub, onPress, danger = false, right
  }: {
    icon: ImageSourcePropType;
    label: string;
    sub?: string;
    onPress?: () => void;
    danger?: boolean;
    right?: React.ReactNode;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>
        <Image 
          source={icon} 
          style={[styles.rowImg, danger && { tintColor: '#f87171' }]} 
        />
      </View>
      <View style={styles.rowDetails}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right ? <View style={styles.rowRight}>{right}</View> : null}
      {onPress && !right ? (
        <Text style={styles.rowChevron}>›</Text>
      ) : null}
    </Pressable>
  );

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>- SETTINGS -</Text>

          {/* ── Account Status Row ── */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <Row
            icon={phoneIcon}
            label={isGuest ? 'Guest Mode' : 'Logged In'}
            sub={
              isGuest
                ? 'Data stored locally only'
                : userId ? `ID: ${userId.slice(0, 8)}...` : ''
            }
            right={
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4ade80' : '#f87171' }]} />
                <Text style={styles.statusPillText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
              </View>
            }
          />

          {isGuest && (
            <>
              <Row icon={doorIcon} label="Login" sub="Log into your account" onPress={() => router.push('/auth/Login')} />
              <Row icon={aboutIcon} label="Sign Up" sub="Create a new account" onPress={() => router.push('/auth/Register')} />
            </>
          )}

          {!isGuest && (
            <Row
              icon={doorIcon}
              label="Log Out"
              sub="Requires internet to sign back in"
              onPress={handleLogout}
              danger
            />
          )}

          {/* ── Sync ── */}
          {isLoggedIn && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>SYNC</Text>

              <Row
                icon={cloudIcon}
                label={syncing ? 'Syncing...' : 'Sync Now'}
                sub="Push local, pull cloud data"
                onPress={syncing ? undefined : handleManualSync}
              />
              {syncMsg ? <Text style={styles.syncMsg}>{syncMsg}</Text> : null}
            </>
          )}

          {/* ── Data ── */}
          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>DATA</Text>

          <Row
            icon={trashcanIcon}
            label="Clear Local Data"
            sub="Remove all locally stored records"
            onPress={() => setShowClearModal(true)}
          />

          {isLoggedIn && (
            <Row
              icon={trashcanIcon}
              label="Clear Online Data"
              sub="Delete everything from the cloud"
              onPress={() => setShowClearOnlineModal(true)}
              danger
            />
          )}

          {/* ── App Info ── */}
          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>APP</Text>

          <Row icon={phoneIcon} label="Expence" sub="Version 1.0.0 — Offline First" />
          <Row icon={aboutIcon} label="About" sub="More information" onPress={() => router.push('/main/About')} />

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Clear Local Data Confirm Modal ── */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CLEAR LOCAL DATA?</Text>
            <Text style={styles.modalBody}>
              This permanently removes all records stored on this device.
              {isLoggedIn ? '\n\nCloud data is unaffected.' : '\n\nThis cannot be undone.'}
            </Text>
            <Pressable style={styles.modalBtnDanger} onPress={handleClearLocalData}>
              <Text style={styles.modalBtnDangerText}>CLEAR LOCAL</Text>
            </Pressable>
            <Pressable style={styles.modalBtnCancel} onPress={() => setShowClearModal(false)}>
              <Text style={styles.modalBtnCancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Clear Online Data Confirm Modal ── */}
      <Modal
        visible={showClearOnlineModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearOnlineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CLEAR CLOUD DATA?</Text>
            <Text style={styles.modalBody}>
              This permanently deletes all your records from the online database.
              {'\n\nLocal records will remain until you sync or clear them.'}
            </Text>
            <Pressable style={styles.modalBtnDanger} onPress={handleClearOnlineData}>
              <Text style={styles.modalBtnDangerText}>CLEAR CLOUD</Text>
            </Pressable>
            <Pressable style={styles.modalBtnCancel} onPress={() => setShowClearOnlineModal(false)}>
              <Text style={styles.modalBtnCancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: '13%',
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },

  pageTitle: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },

  sectionLabel: {
    alignSelf: 'flex-start',
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 6,
    marginLeft: 10,
  },

  // ── Row — mirrors Transaction.tsx card exactly ──────────────────────────────
  row: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 10,
    backgroundColor: '#afadad28',       // same as Transaction
    borderRadius: 5,                     // same as Transaction
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minWidth: 250,
    maxWidth: 300,
    alignSelf: 'center',
    minHeight: 60,
  },
  rowPressed: {
    backgroundColor: 'rgba(175,173,173,0.18)',
  },
  rowIcon: {
    marginRight: 18,
    marginLeft: -2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowImg: {
    width: 25,
    height: 25,
  },
  rowDetails: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 14,
  },
  rowLabelDanger: {
    color: '#f87171',
  },
  rowSub: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  rowRight: {
    marginLeft: 'auto',
  },
  rowChevron: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 22,
    marginLeft: 'auto',
  },

  // ── Status pill ──────────────────────────────────────────────────────────
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },

  syncMsg: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 6,
  },

  // ── Modal ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1d1d36',
    borderRadius: 5,                    // match card radius
    padding: 24,
    width: '100%',
    maxWidth: 300,                      // match card maxWidth
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 17,
  },
  modalBtnDanger: {
    backgroundColor: '#afadad28',
    padding: 14,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnDangerText: {
    fontFamily: 'VCR-Mono',
    color: '#f87171',
    fontSize: 14,
  },
  modalBtnCancel: {
    backgroundColor: '#afadad28',
    padding: 14,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontFamily: 'VCR-Mono',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});