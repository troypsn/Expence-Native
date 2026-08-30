import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";

/**
 * Compresses an image and uploads it to the Supabase storage bucket "transaction-images".
 * Returns the public URL of the uploaded image.
 * If the image is already a remote URL or a base64 placeholder, it is returned unchanged.
 */
function decodeBase64(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}

export async function uploadTransactionImage(
  userId: string,
  imageUri: string | null,
  localId: number,
): Promise<string | null> {
  console.log("[imageUpload] Starting upload for transaction:", localId, "uri:", imageUri);
  if (!imageUri) {
    console.log("[imageUpload] No imageUri provided");
    return null;
  }
  // If already a remote URL or a preset placeholder, skip upload
  if (imageUri.startsWith("http") || imageUri.startsWith("base64:")) {
    console.log("[imageUpload] Already a remote/preset image, skipping upload");
    return imageUri;
  }
  try {
    // Compress the image to reduce size (50% quality)
    console.log("[imageUpload] Manipulating image...");
    const manipulated = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    console.log("[imageUpload] Image manipulated successfully:", manipulated.uri);

    // Read the compressed file as a base64 string
    console.log("[imageUpload] Reading file as Base64...");
    const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("[imageUpload] Decoding Base64 to ArrayBuffer...");
    const arrayBuffer = decodeBase64(base64);

    const path = `${userId}/tx_${localId}_${Date.now()}.jpg`;
    console.log("[imageUpload] Uploading ArrayBuffer to Supabase path:", path);
    const { error } = await supabase.storage
      .from("transaction-images")
      .upload(path, arrayBuffer, {
        contentType: "image/jpeg",
      });
    if (error) {
      console.warn("[imageUpload] Upload error from Supabase Storage:", error.message, error);
      return null;
    }
    console.log("[imageUpload] Upload successful. Getting public URL...");
    const { data } = supabase.storage
      .from("transaction-images")
      .getPublicUrl(path);
    console.log("[imageUpload] Public URL generated:", data.publicUrl);
    return data.publicUrl;
  } catch (e) {
    console.warn("[imageUpload] Unexpected error during upload flow:", e);
    return null;
  }
}

/**
 * Placeholder for shortcut images – currently uses the same bucket.
 */
export async function uploadShortcutImage(
  userId: string,
  imageUri: string | null,
  localId: number,
): Promise<string | null> {
  // Reuse the same logic; could be a different bucket in future
  return uploadTransactionImage(userId, imageUri, localId);
}
