import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type TransactionDetails = {
  title: string;
  amount: number;
  image: string;
  description: string;
  created_at: string;
};

type Props = {
  visible: boolean;
  transaction: TransactionDetails | null;
  onClose: () => void;
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} · ${timeStr}`;
};

const TransactionDetailsModal = ({ visible, transaction, onClose }: Props) => {
  const imageSource =
    transaction?.image &&
    (transaction.image.startsWith("file://") ||
      transaction.image.startsWith("content://") ||
      transaction.image.startsWith("data:") ||
      transaction.image.startsWith("http"))
      ? { uri: transaction.image }
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Transaction details</Text>
          {imageSource ? (
            <Image source={imageSource} style={styles.detailImage} />
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <Text style={styles.value}>{transaction?.title ?? "Unknown"}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>
              ${transaction?.amount.toFixed(2) ?? "0.00"}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {transaction ? formatDate(transaction.created_at) : "-"}
            </Text>
          </View>

          <View style={styles.fieldDescription}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.descriptionText}>
              {transaction?.description?.trim()
                ? transaction.description
                : "No description provided."}
            </Text>
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1d1d36",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 22,
  },
  title: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  field: {
    marginBottom: 14,
  },
  fieldDescription: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginBottom: 6,
  },
  value: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionText: {
    fontFamily: "VCR-Mono",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: "#afadad28",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontFamily: "VCR-Mono",
    color: "white",
    fontSize: 13,
  },
  detailImage: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    marginBottom: 16,
    resizeMode: "cover",
  },
});

export default TransactionDetailsModal;
