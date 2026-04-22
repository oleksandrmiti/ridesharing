import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../utils/firebase';

type AuthRoles = {
  SignIn: undefined;
  SignUp: undefined;
}

export default function SignIn() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to sign in');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Sign In</Text>

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

      <Pressable onPress={onSignIn} style={{ padding: 12, borderRadius: 8, borderWidth: 1 }}>
        <Text>Sign In</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('SignUp')}>
      <Text>Create account</Text>
    </Pressable>
    </SafeAreaView>
  );
}