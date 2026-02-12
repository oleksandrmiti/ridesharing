import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../utils/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';

type AuthRoles = {
  SignIn: undefined;
  SignUp: undefined;
}

export default function SignUp() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSignUp = async () => {
    setError(null);
    try {
      const normalized = email.trim().toLowerCase();
      const allowed = normalized.endsWith('@mycit.ie') || normalized.endsWith('@mymtu.ie');

      if (!allowed) {
        setError('Please register with your MTU email (@mycit.ie or @mymtu.ie).');
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        phone: '',
        displayName: '',
        course: '',
        year: null,
        profileCompleted: false,
        preferredLocations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });

      await sendEmailVerification(cred.user);
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to sign up');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '600' }}>Sign Up</Text>

        <TextInput
          autoCapitalize="none"
          placeholder="MTU email (must end with @mycit.ie or @mymtu.ie)"
          value={email}
          onChangeText={setEmail}
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />

        {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

        <Pressable onPress={onSignUp} style={{ padding: 12, borderRadius: 8, borderWidth: 1 }}>
          <Text>Create Account</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text>Back to Sign In</Text>
        </Pressable>
    </SafeAreaView>
  );
}