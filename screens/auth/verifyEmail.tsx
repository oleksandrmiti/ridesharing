import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { auth } from '../../utils/firebase';
import { sendEmailVerification, reload, signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function VerifyEmailScreen() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  
  const onResend = async () => {
    setMsg(null);

    const user = auth.currentUser;
    if (!user) return;

    try {
      setBusy(true);
      await sendEmailVerification(user);
      setMsg('Verification email sent. Please check your inbox (and spam).');
    } catch (e: any) {
      Alert.alert('Could not resend verification', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const onIHaveVerified = async () => {
    setMsg(null);

    const user = auth.currentUser;
    if (!user) return;

    try {
      setBusy(true);
      await reload(user);
      setUser(auth.currentUser);

      await auth.currentUser?.getIdToken(true);
      if (auth.currentUser?.emailVerified) {
        setMsg('Email verified ✅ You can continue.');
      } else {
        setMsg('Still not verified. Open the link in your email, then tap again.');
      }
    } catch (e: any) {
      Alert.alert('Could not refresh status', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
    }
  };

  const email = auth.currentUser?.email ?? '';

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Verify your email</Text>

      <Text>
        We sent a verification link to:
        {'\n'}
        <Text style={{ fontWeight: '600' }}>{email}</Text>
      </Text>

      <Text>
        Open the email and tap the verification link. Then come back and press “I verified”.
      </Text>

      {msg ? <Text>{msg}</Text> : null}

      <Pressable
        onPress={onResend}
        disabled={busy}
        style={{ padding: 12, borderRadius: 8, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
      >
        <Text>Resend verification email</Text>
      </Pressable>

      <Pressable
        onPress={onIHaveVerified}
        disabled={busy}
        style={{ padding: 12, borderRadius: 8, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
      >
        <Text>I verified</Text>
      </Pressable>

      <Pressable
        onPress={onSignOut}
        disabled={busy}
        style={{ padding: 12, borderRadius: 8, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
      >
        <Text>Sign out</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}