import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import ngeohash from 'ngeohash';

type PreferredLocation = {
  id?: string;
  label: string;
  geohash: string;
  lat: number;
  lng: number;
}

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const round = (v: number, decimals: number) =>
  Math.round(v * 10 ** decimals) / 10 ** decimals;

export default function OnboardingScreen() {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [preferredLocation, setPreferredLocation] = useState<PreferredLocation | null>(null);

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
          const locs = d.preferredLocations ?? [];
          if (Array.isArray(locs) && locs.length > 0) {
            setPreferredLocation(locs[0]);
            setLocationLabel(locs[0].label ?? 'Home');
          }
        }
      } catch (e: any) {
        Alert.alert('Failed to load profile', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  const onUseCurrentArea = async () => {
  setError(null);
  if (!uid) return;

  try {
    setBusy(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to set a preferred area.');
      return;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const latCoarse = round(lat, 3);
    const lngCoarse = round(lng, 3);

    const geohashPrecision = 6;
    const gh = ngeohash.encode(lat, lng, geohashPrecision);

    let publicLabel = 'Pinned area';

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      const place = places?.[0];
      publicLabel =
        place?.district ||
        place?.subregion ||
        place?.city ||
        place?.region ||
        'Pinned area';
    } catch {

    }

    setPreferredLocation({
      id: makeId(),
      label: publicLabel,
      geohash: gh,
      lat: latCoarse,
      lng: lngCoarse,
    });
  } catch (e: any) {
    Alert.alert('Failed to get location', e?.message ?? 'Unknown error');
  } finally {
    setBusy(false);
  }
};

  const onSave = async () => {
    setError(null);
    if (!uid) return;

    const yearNum = Number(year);
    if (!displayName.trim()) return setError('Please enter your name.');
    if (!course.trim()) return setError('Please enter your course.');
    if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
      return setError('Please enter a valid year (e.g., 1–4).');
    }

    try {
      setBusy(true);
      await auth.currentUser?.getIdToken(true);

      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const existingLocations = snap.exists() ? (snap.data() as any).preferredLocations ?? [] : [];

      const update: any = {
        uid,
        email: auth.currentUser?.email ?? null,
        displayName: displayName.trim(),
        course: course.trim(),
        year: yearNum,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      };

      // Save preferred location if user set it
       if (preferredLocation && (!Array.isArray(existingLocations) || existingLocations.length === 0)) {
        const locId = preferredLocation.id ?? makeId();

        update.preferredLocations = [
          {
            id: locId,
            privateLabel: locationLabel.trim() || 'Home',
            publicLabel: preferredLocation.label,
            geohash: preferredLocation.geohash,
            lat: preferredLocation.lat,
            lng: preferredLocation.lng,
            createdAt: new Date().toISOString(),
          },
        ];

        update.defaultPreferredLocationId = locId;
      }

      await setDoc(userRef, update, { merge: true });
    } catch (e: any) {
      Alert.alert('Failed to save', e?.message ?? 'Unknown error');
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

  if (loading) return null;

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
    <View style={{ gap: 12 }}>
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

      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8 }}>
        Preferred pickup area (optional)
      </Text>

      <TextInput
        placeholder="Label (e.g., Home, Apartment)"
        value={locationLabel}
        onChangeText={setLocationLabel}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Pressable
        onPress={onUseCurrentArea}
        disabled={busy}
        style={{ padding: 12, borderRadius: 8, borderWidth: 1, opacity: busy ? 0.6 : 1 }}
      >
        <Text>
          {preferredLocation
            ? `Area set: ${preferredLocation.label} (${preferredLocation.geohash})`
            : 'Use my current area'}
        </Text>
      </Pressable>

      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

      <Pressable 
        onPress={onSave}
        disabled={busy}
        style={{ padding: 12, borderRadius: 8, borderWidth: 1, opacity: busy ? 0.6 : 1  }}
      >
        <Text>Continue</Text>
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