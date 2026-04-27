import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser, signOut } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../../utils/firebase';

export default function UserPreferences() {
  const [busy, setBusy] = useState(false);

  const onDisableAccount = () => {
    Alert.alert(
      'Disable account',
      'Your account will be marked as inactive and you will be signed out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
              setBusy(true);

              await updateDoc(doc(db, 'users', user.uid), {
                isActive: false,
                disabledAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              await signOut(auth);
            } catch (e: any) {
              Alert.alert('Failed to disable account', e?.message ?? 'Unknown error');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
              setBusy(true);

              await deleteDoc(doc(db, 'users', user.uid));
              await deleteUser(user);
            } catch (e: any) {
              if (e?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Please sign in again',
                  'For security, Firebase requires you to sign in again before deleting your account.'
                );
              } else {
                Alert.alert('Failed to delete account', e?.message ?? 'Unknown error');
              }
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <Pressable
          disabled={busy}
          onPress={onDisableAccount}
          style={[styles.button, busy && styles.disabled]}
        >
          <Text style={styles.buttonText}>Disable Account</Text>
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={onDeleteAccount}
          style={[styles.deleteButton, busy && styles.disabled]}
        >
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
    color: '#111827',
  },
  deleteButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '700',
    color: '#DC2626',
  },
  disabled: {
    opacity: 0.6,
  },
});