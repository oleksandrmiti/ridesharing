import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { auth, db } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState(''); // keep as string input
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          setDisplayName(d.displayName ?? '');
          setCourse(d.course ?? '');
          setYear(d.year?.toString?.() ?? '');
        }
      } catch (e: any) {
        Alert.alert('Failed to load profile', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  const onSave = async () => {
    setError(null);
    if (!uid) return;

    const yearNum = Number(year);
    if (!displayName.trim()) return setError('Please enter your name.');
    if (!course.trim()) return setError('Please enter your course.');
    if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 10) {
      return setError('Please enter a valid year (e.g., 1–4).');
    }

    try {
      await auth.currentUser?.getIdToken(true);
      console.log('UID:', auth.currentUser?.uid);
      await updateDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        course: course.trim(),
        year: yearNum,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      Alert.alert('Failed to save', e?.message ?? 'Unknown error');
    }
  };

   const onSignOut = async () => {
        try {
        await signOut(auth);
        } catch (e: any) {
        Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
        }
    }; 
  if (loading) return null;

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Finish setup</Text>

      <TextInput
        placeholder="Your name"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Course (e.g., Software Development)"
        value={course}
        onChangeText={setCourse}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Year (e.g., 4)"
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

      <Pressable onPress={onSave} style={{ padding: 12, borderRadius: 8, borderWidth: 1 }}>
        <Text>Continue</Text>
      </Pressable>
      <Pressable
            onPress={onSignOut}
            style={{ padding: 12, borderRadius: 8, borderWidth: 1 }}
        >
        <Text>Sign out</Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
} 