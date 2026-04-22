import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { auth, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ngeohash from 'ngeohash';

import type { GeoLite } from '../store/firestore';

type PreferredLocation = {
  id?: string;
  privateLabel?: string;
  publicLabel?: string;
  geohash: string;
  lat: number;
  lng: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (geo: GeoLite) => void;
  onOpenMap: () => void;
};

const round = (v: number, decimals: number) =>
  Math.round(v * 10 ** decimals) / 10 ** decimals;

export default function LocationSelectModal({
  visible,
  onClose,
  onSelect,
  onOpenMap,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [preferredLocations, setPreferredLocations] = useState<PreferredLocation[]>([]);

  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      try {
        setLoading(true);
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) {
          setPreferredLocations([]);
          return;
        }

        const data = snap.data() as any;
        const locs = Array.isArray(data.preferredLocations) ? data.preferredLocations : [];
        setPreferredLocations(locs);
      } catch (e: any) {
        Alert.alert('Failed to load saved locations', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible]);

  const onUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let label = 'Current area';

      try {
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const place = places?.[0];
        label =
          place?.district ||
          place?.subregion ||
          place?.city ||
          place?.region ||
          'Current area';
      } catch {
        // keep fallback label
      }

      onSelect({
        label,
        lat: round(lat, 2),
        lng: round(lng, 2),
        geohash: ngeohash.encode(lat, lng, 6),
      });

      onClose();
    } catch (e: any) {
      Alert.alert('Failed to get location', e?.message ?? 'Unknown error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Choose starting location</Text>

          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              {preferredLocations.map((loc, index) => (
                <Pressable
                  key={loc.id ?? `${loc.label}-${index}`}
                  style={styles.option}
                  onPress={() => {
                    onSelect({
                        geohash: loc.geohash,
                        lat: loc.lat,
                        lng: loc.lng,
                        label: loc.publicLabel ?? 'Selected area',
                        });
                    onClose();
                  }}
                >
                <Text style={styles.optionText}>
                    {loc.privateLabel ?? loc.publicLabel ?? 'Saved place'}
                </Text>
                
                </Pressable>
              ))}

              <Pressable style={styles.option} onPress={onUseCurrentLocation}>
                <Text style={styles.optionText}>Use current location</Text>
              </Pressable>

              <Pressable
                style={styles.option}
                onPress={() => {
                  onClose();
                  onOpenMap();
                }}
              >
                <Text style={styles.optionText}>Pick on map</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text>Cancel</Text>
          </Pressable>
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
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
  },
  cancel: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 12,
  },
});