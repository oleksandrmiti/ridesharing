import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';

type Props = {
  visible: boolean;
  title?: string;
  placeholder?: string;
  defaultValue?: string;
  onCancel: () => void;
  onConfirm: (label: string) => void;
};

export default function PrivateLabelModal({
  visible,
  title = 'Location name',
  placeholder = 'e.g. Home, Apartment',
  defaultValue = '',
  onCancel,
  onConfirm,
}: Props) {
  const [label, setLabel] = useState(defaultValue);

  useEffect(() => {
    if (visible) setLabel(defaultValue);
  }, [visible, defaultValue]);

  const handleConfirm = () => {
    Keyboard.dismiss();
    onConfirm(label.trim() || 'Saved location');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={placeholder}
            autoFocus
            style={styles.input}
          />

          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleConfirm} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  primaryButton: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#6D5EF5',
  },
  secondaryText: {
    fontWeight: '700',
    color: '#111827',
  },
  primaryText: {
    fontWeight: '700',
    color: '#fff',
  },
});