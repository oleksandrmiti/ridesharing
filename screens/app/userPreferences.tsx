import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../utils/firebase';
import Feather from '@expo/vector-icons/Feather';
import LocationSelectModal from '../../components/LocationSelectModal';
import MapPickerModal from '../../components/MapPickerModal';
import type { GeoLite } from '../../store/firestore';
import PrivateLabelModal from '../../components/PrivateLabelModal';

type PreferredLocation = {
  id?: string;
  privateLabel?: string;
  publicLabel?: string;
  label?: string;
  geohash: string;
  lat: number;
  lng: number;
};

export default function UserPreferences() {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [preferredLocations, setPreferredLocations] = useState<PreferredLocation[]>([]);
  const [locationSelectOpen, setLocationSelectOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const [pendingGeo, setPendingGeo] = useState<GeoLite | null>(null);
  const [privateLabelOpen, setPrivateLabelOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));

        if (snap.exists()) {
          const data = snap.data() as any;

          setDisplayName(data.displayName ?? '');
          setEmail(data.email ?? user.email ?? '');
          setPhone(data.phone ?? '');
          setCourse(data.course ?? '');
          setYear(data.year?.toString?.() ?? '');
          setRatingAvg(typeof data.ratingAvg === 'number' ? data.ratingAvg : 5);
          setRatingCount(typeof data.ratingCount === 'number' ? data.ratingCount : 0);
          setPreferredLocations(
            Array.isArray(data.preferredLocations) ? data.preferredLocations : []
          );
        }
      } catch (e: any) {
        Alert.alert('Failed to load profile', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

const onDeletePreferredLocation = async (locationId?: string) => {
  const user = auth.currentUser;
  if (!user || !locationId) return;

  const nextLocations = preferredLocations.filter((loc) => loc.id !== locationId);

  try {
    setBusy(true);

    await updateDoc(doc(db, 'users', user.uid), {
      preferredLocations: nextLocations,
      updatedAt: serverTimestamp(),
    });

    setPreferredLocations(nextLocations);
  } catch (e: any) {
    Alert.alert('Failed to delete location', e?.message ?? 'Unknown error');
  } finally {
    setBusy(false);
  }
};

const onLocationPicked = (geo: GeoLite) => {
  setPendingGeo(geo);
  setPrivateLabelOpen(true);
};

const onConfirmPrivateLabel = async (privateLabel: string) => {
  const user = auth.currentUser;
  if (!user || !pendingGeo) return;

  const loc = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    privateLabel,
    publicLabel: pendingGeo.label ?? 'Selected area',
    geohash: pendingGeo.geohash,
    lat: pendingGeo.lat,
    lng: pendingGeo.lng,
    createdAt: new Date().toISOString(),
  };

  const nextLocations = [...preferredLocations, loc];

  try {
    setBusy(true);

    const updateData: any = {
      preferredLocations: nextLocations,
      updatedAt: serverTimestamp(),
    };

    if (preferredLocations.length === 0) {
      updateData.defaultPreferredLocationId = loc.id;
    }

    await updateDoc(doc(db, 'users', user.uid), updateData);

    setPreferredLocations(nextLocations);
    setPendingGeo(null);
    setPrivateLabelOpen(false);
  } catch (e: any) {
    Alert.alert('Failed to add location', e?.message ?? 'Unknown error');
  } finally {
    setBusy(false);
  }
};

const onSaveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const yearNum = Number(year);

  if (!displayName.trim()) {
    Alert.alert('Missing name', 'Please enter your name.');
    return;
  }

  if (!phone.trim()) {
    Alert.alert('Missing phone', 'Please enter your phone number.');
    return;
  }

  if (!course.trim()) {
    Alert.alert('Missing course', 'Please enter your course.');
    return;
  }

  if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
    Alert.alert('Invalid year', 'Please enter a valid year between 1 and 4.');
    return;
  }

  try {
    setBusy(true);

    await updateDoc(doc(db, 'users', user.uid), {
      displayName: displayName.trim(),
      course: course.trim(),
      year: yearNum,
      phone: phone.trim(),
      updatedAt: serverTimestamp(),
      });

      Alert.alert('Profile updated', 'Your profile has been saved.');
    } catch (e: any) {
      Alert.alert('Failed to save profile', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    try {
      setBusy(true);
      await signOut(auth);
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

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
                  'Firebase requires you to sign in again before deleting your account.'
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ratingLabel =
    ratingCount === 0
      ? 'New user'
      : `${ratingAvg?.toFixed(1) ?? '5.0'} ⭐ (${ratingCount})`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.readOnly}>{email}</Text>

          <Text style={styles.label}>Rating</Text>
          <Text style={styles.readOnly}>{ratingLabel}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Course</Text>
          <TextInput
            value={course}
            onChangeText={setCourse}
            placeholder="Course"
            style={styles.input}
          />

          <Text style={styles.label}>Year</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="Year"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Pressable
            disabled={busy}
            onPress={onSaveProfile}
            style={[styles.primaryButton, busy && styles.disabled]}
          >
            <Text style={styles.primaryButtonText}>Save Profile</Text>
          </Pressable>
        </View>

<View style={styles.card}>
  <Text style={styles.sectionTitle}>Preferred Locations</Text>

  {preferredLocations.length === 0 ? (
    <Text style={styles.helperText}>No preferred locations saved yet.</Text>
  ) : (
    preferredLocations.map((loc, index) => (
      <View key={loc.id ?? index} style={styles.locationItem}>
        <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>
              {loc.privateLabel ?? loc.label ?? 'Saved location'}
            </Text>
            <Text style={styles.locationSub}>
              Public area: {loc.publicLabel ?? loc.label ?? 'Unknown area'}
            </Text>
          </View>

          <Pressable
            disabled={busy}
            onPress={() => onDeletePreferredLocation(loc.id)}
            style={styles.smallDeleteButton}
          >
            <Text style={styles.smallDeleteText}>Delete</Text>
          </Pressable>
        </View>
        )
      )
    )
  }

          <Pressable
            disabled={busy}
            onPress={() => setLocationSelectOpen(true)}
            style={[styles.button, busy && styles.disabled]}
          >
            <Text style={styles.buttonText}>Add Preferred Location</Text>
          </Pressable>

          <Text style={styles.privacyNote}>
            Private labels like “Home” are only visible to you. Other users only see the
            public area label.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

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

          <Pressable
            disabled={busy}
            onPress={onSignOut}
            style={[styles.button, busy && styles.disabled]}
          >
            <Text style={styles.deleteText}>Sign Out</Text>
            <Feather name="log-out" size={20} color="red" />
          </Pressable>
        </View>

        <LocationSelectModal
          visible={locationSelectOpen}
          onClose={() => setLocationSelectOpen(false)}
          onSelect={(geo) => {
            setLocationSelectOpen(false);
            onLocationPicked(geo);
          }}
          onOpenMap={() => {
            setLocationSelectOpen(false);
            setMapOpen(true);
          }}
        />

        <MapPickerModal
          visible={mapOpen}
          onClose={() => setMapOpen(false)}
          onConfirm={(geo) => {
            setMapOpen(false);
            onLocationPicked(geo);
          }}
        />

        <PrivateLabelModal
          visible={privateLabelOpen}
          defaultValue=""
          onCancel={() => {
            setPrivateLabelOpen(false);
            setPendingGeo(null);
          }}
          onConfirm={onConfirmPrivateLabel}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingBottom: -33,},
  container: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  readOnly: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#6D5EF5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
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
  helperText: {
    color: '#6B7280',
  },
  locationItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  locationSub: {
    color: '#6B7280',
    marginTop: 2,
  },
  privacyNote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  smallDeleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  smallDeleteText: {
    color: '#DC2626',
    fontWeight: '700',
  },
});