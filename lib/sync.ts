import { supabase } from './supabase';
import {
  getPendingTransactions,
  getPendingShortcuts,
  markTransactionSynced,
  markShortcutSynced,
  upsertTransactionFromRemote,
  upsertShortcutFromRemote,
} from './db';

/**
 * Push all locally-pending (unsynced) records to Supabase.
 * Called automatically when the device comes online and user is logged in.
 */
export async function syncPendingData(userId: string): Promise<void> {
  try {
    // ── Sync Transactions ──
    const pendingTransactions = await getPendingTransactions(userId);

    for (const tx of pendingTransactions) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          title: tx.title,
          amount: tx.amount,
          image: tx.image,
          description: tx.description,
          created_at: tx.created_at,
        })
        .select('transaction_id')
        .single();

      if (!error && data?.transaction_id && tx.local_id !== undefined) {
        await markTransactionSynced(tx.local_id, data.transaction_id);
        console.log('[sync] Transaction synced:', tx.title, '→ remote id', data.transaction_id);
      } else if (error) {
        console.warn('[sync] Failed to sync transaction:', tx.title, error.message);
      }
    }

    // ── Sync Shortcuts ──
    const pendingShortcuts = await getPendingShortcuts(userId);

    for (const sc of pendingShortcuts) {
      const { data, error } = await supabase
        .from('shortcuts')
        .insert({
          user_id: userId,
          title: sc.title,
          amount: sc.amount,
          image: sc.image,
          description: sc.description,
          created_at: sc.created_at,
        })
        .select('shortcut_id')
        .single();

      if (!error && data?.shortcut_id && sc.local_id !== undefined) {
        await markShortcutSynced(sc.local_id, data.shortcut_id);
        console.log('[sync] Shortcut synced:', sc.title, '→ remote id', data.shortcut_id);
      } else if (error) {
        console.warn('[sync] Failed to sync shortcut:', sc.title, error.message);
      }
    }

    console.log('[sync] Sync complete. Transactions:', pendingTransactions.length, 'Shortcuts:', pendingShortcuts.length);
  } catch (err) {
    console.warn('[sync] Sync error:', err);
  }
}

/**
 * Pull all of the user's Supabase records and cache them locally.
 * Called after a successful login to seed the local DB.
 */
export async function fetchAndCacheFromSupabase(userId: string): Promise<void> {
  try {
    // ── Fetch Transactions ──
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (txError) {
      console.warn('[sync] Error fetching remote transactions:', txError.message);
    } else if (txData) {
      for (const row of txData) {
        await upsertTransactionFromRemote(row);
      }
      console.log('[sync] Cached', txData.length, 'transactions from Supabase');
    }

    // ── Fetch Shortcuts ──
    const { data: scData, error: scError } = await supabase
      .from('shortcuts')
      .select('*')
      .eq('user_id', userId);

    if (scError) {
      console.warn('[sync] Error fetching remote shortcuts:', scError.message);
    } else if (scData) {
      for (const row of scData) {
        await upsertShortcutFromRemote(row);
      }
      console.log('[sync] Cached', scData.length, 'shortcuts from Supabase');
    }
  } catch (err) {
    console.warn('[sync] Cache error:', err);
  }
}
