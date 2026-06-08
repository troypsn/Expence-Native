import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";

/**
 * Compresses an image and uploads it to the Supabase storage bucket "transaction-images".
 * Returns the public URL of the uploaded image.
 * If the image is already a remote URL or a base64 placeholder, it is returned unchanged.
 */
export async function uploadTransactionImage(
  userId: string,
  imageUri: string | null,
  localId: number,
): Promise<string | null> {
  if (!imageUri) return null;
  // If already a remote URL or a preset placeholder, skip upload
  if (imageUri.startsWith("http") || imageUri.startsWith("base64:")) {
    return imageUri;
  }
  try {
    // Compress the image to reduce size (50% quality)
    const manipulated = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    // Read the compressed file as a blob
    const fileInfo = await FileSystem.getInfoAsync(manipulated.uri, {
      size: true,
    });
    if (!fileInfo.exists) return null;
    const response = await fetch(manipulated.uri);
    const blob = await response.blob();
    const path = `${userId}/tx_${localId}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("transaction-images")
      .upload(path, blob, {
        contentType: "image/jpeg",
      });
    if (error) {
      console.warn("[imageUpload] Upload error:", error.message);
      return null;
    }
    const { data } = supabase.storage
      .from("transaction-images")
      .getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[imageUpload] Unexpected error:", e);
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
