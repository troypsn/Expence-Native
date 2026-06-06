import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  body: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

const ConfirmationModal = ({
  visible,
  title,
  body,
  confirmText,
  onConfirm,
  onCancel,
  danger = true
}: ConfirmationModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
          
          <Pressable 
            style={styles.modalBtnAction} 
            onPress={onConfirm}
          >
            <Text style={[
              styles.modalBtnActionText, 
              danger && styles.modalBtnDangerText
            ]}>
              {confirmText}
            </Text>
          </Pressable>
          
          <Pressable style={styles.modalBtnCancel} onPress={onCancel}>
            <Text style={styles.modalBtnCancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1d1d36',
    borderRadius: 5,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  modalBtnAction: {
    backgroundColor: '#afadad28',
    padding: 14,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnActionText: {
    fontFamily: 'VCR-Mono',
    color: 'white',
    fontSize: 14,
  },
  modalBtnDangerText: {
    color: '#f87171',
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

export default ConfirmationModal;
