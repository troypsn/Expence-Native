import {
  getPendingShortcuts,
  getPendingTransactions,
  markShortcutSynced,
  markTransactionSynced,
  upsertShortcutFromRemote,
  upsertTransactionFromRemote,
} from "./db";
import { uploadShortcutImage, uploadTransactionImage } from "./imageUpload";
import { supabase } from "./supabase";

//bucketname

const supabaseBucketName = "transaction-images";

/**
 * Push all locally-pending (unsynced) records to Supabase.
 * Called automatically when the device comes online and user is logged in.
 */
export async function syncPendingData(userId: string): Promise<void> {
  console.log("[sync] Starting syncPendingData for user:", userId);
  try {
    // ── Sync Transactions ──
    const pendingTransactions = await getPendingTransactions(userId);
    console.log("[sync] Found pending transactions to sync:", pendingTransactions.length);

    for (const tx of pendingTransactions) {
      console.log("[sync] Processing pending transaction:", tx.local_id, "title:", tx.title, "imageUri:", tx.image);
      // If the image is a local file, upload it first
      let remoteImage = tx.image;
      const isLocalTx =
        typeof tx.image === "string" &&
        (tx.image.startsWith("file://") ||
          tx.image.startsWith("content://") ||
          tx.image.startsWith("data:"));
      if (isLocalTx) {
        console.log("[sync] Transaction has local image path. Initiating upload...");
        const uploaded = await uploadTransactionImage(
          userId,
          tx.image,
          tx.local_id!,
        );
        console.log("[sync] Upload result (remote image URL):", uploaded);
        if (uploaded) remoteImage = uploaded;
      } else {
        console.log("[sync] Transaction does not have a local image path to upload.");
      }

      console.log("[sync] Inserting transaction into remote Supabase database with image path/URL:", remoteImage);
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          title: tx.title,
          amount: tx.amount,
          image: remoteImage,
          description: tx.description,
          created_at: tx.created_at,
        })
        .select("transaction_id")
        .single();

      if (!error && data?.transaction_id && tx.local_id !== undefined) {
        await markTransactionSynced(tx.local_id, data.transaction_id);
        console.log(
          "[sync] Transaction synced successfully:",
          tx.title,
          "→ remote id",
          data.transaction_id,
        );
      } else if (error) {
        console.warn(
          "[sync] Failed to sync transaction:",
          tx.title,
          "Error:",
          error.message,
          error
        );
      }
    }

    // ── Sync Shortcuts ──
    const pendingShortcuts = await getPendingShortcuts(userId);

    for (const sc of pendingShortcuts) {
      // Upload local image if needed
      let remoteImage = sc.image;
      const isLocalSc =
        typeof sc.image === "string" &&
        (sc.image.startsWith("file://") ||
          sc.image.startsWith("content://") ||
          sc.image.startsWith("data:"));
      if (isLocalSc) {
        const uploaded = await uploadShortcutImage(
          userId,
          sc.image,
          sc.local_id,
        );
        if (uploaded) remoteImage = uploaded;
      }
      const { data, error } = await supabase
        .from("shortcuts")
        .insert({
          user_id: userId,
          title: sc.title,
          amount: sc.amount,
          image: remoteImage,
          description: sc.description,
          created_at: sc.created_at,
        })
        .select("shortcut_id")
        .single();

      if (!error && data?.shortcut_id && sc.local_id !== undefined) {
        await markShortcutSynced(sc.local_id, data.shortcut_id);
        console.log(
          "[sync] Shortcut synced:",
          sc.title,
          "→ remote id",
          data.shortcut_id,
        );
      } else if (error) {
        console.warn(
          "[sync] Failed to sync shortcut:",
          sc.title,
          error.message,
        );
      }
    }

    console.log(
      "[sync] Sync complete. Transactions:",
      pendingTransactions.length,
      "Shortcuts:",
      pendingShortcuts.length,
    );
  } catch (err) {
    console.warn("[sync] Sync error:", err);
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
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    if (txError) {
      console.warn(
        "[sync] Error fetching remote transactions:",
        txError.message,
      );
    } else if (txData) {
      for (const row of txData) {
        await upsertTransactionFromRemote(row);
      }
      console.log("[sync] Cached", txData.length, "transactions from Supabase");
    }

    // ── Fetch Shortcuts ──
    const { data: scData, error: scError } = await supabase
      .from("shortcuts")
      .select("*")
      .eq("user_id", userId);

    if (scError) {
      console.warn("[sync] Error fetching remote shortcuts:", scError.message);
    } else if (scData) {
      for (const row of scData) {
        await upsertShortcutFromRemote(row);
      }
      console.log("[sync] Cached", scData.length, "shortcuts from Supabase");
    }
  } catch (err) {
    console.warn("[sync] Cache error:", err);
  }
}


// upload image 


async function uploadImage(localFilePath: string, transactionId: Number) {
  try {
    const { data, error } = await supabase.storage
      .from(supabaseBucketName)
      .upload(`${transactionId}.jpg`, localFilePath);

    if (error) {
      throw new Error("Error uploading image:", error);
    }

    return data;
  } catch (err) {
    console.error("Image upload error:", err);
    return null;
  }
}