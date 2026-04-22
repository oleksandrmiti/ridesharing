import React, { useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import ngeohash from 'ngeohash';
import type { GeoLite } from '../store/firestore';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: GeoLite) => void;
  initialRegion?: Region;
};

const round = (v: number, decimals: number) =>
  Math.round(v * 10 ** decimals) / 10 ** decimals;

const GEOHASH_PRECISION = 6;

export default function MapPickerModal({
  visible,
  onClose,
  onConfirm,
  initialRegion,
}: Props) {
  const mapRef = useRef<MapView>(null);

  const defaultRegion = useMemo<Region>(
    () =>
      initialRegion ?? {
        latitude: 51.885,
        longitude: -8.533,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
    [initialRegion]
  );

  const [region, setRegion] = useState<Region>(defaultRegion);

  const onCenterToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 500);
    } catch (e: any) {
      Alert.alert('Failed to get current location', e?.message ?? 'Unknown error');
    }
  };

const onSave = async () => {
  const lat = round(region.latitude, 2);
  const lng = round(region.longitude, 2);

  let publicLabel = 'Pinned area';

  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: region.latitude,
      longitude: region.longitude,
    });

    const place = places?.[0];

    publicLabel =
      place?.district ||
      place?.subregion ||
      place?.city ||
      place?.region ||
      'Pinned area';
  } catch {
    // fallback label
  }

  onConfirm({
    label: publicLabel,
    lat,
    lng,
    geohash: ngeohash.encode(region.latitude, region.longitude, GEOHASH_PRECISION),
  });

  onClose();
};

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={defaultRegion}
          onRegionChangeComplete={setRegion}
        />

        <View pointerEvents="none" style={styles.pinContainer}>
          <Text style={styles.pin}>📍</Text>
        </View>

        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.topButton}>
            <Text>Close</Text>
          </Pressable>

          <Pressable onPress={onCenterToCurrentLocation} style={styles.topButton}>
            <Text>My location</Text>
          </Pressable>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.title}>Choose pickup area</Text>
          <Text style={styles.coords}>
            {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
          </Text>

          <Pressable onPress={onSave} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Confirm location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  pin: { fontSize: 32 },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  coords: {
    color: '#666',
    marginBottom: 14,
  },
  confirmButton: {
    backgroundColor: '#6D5EF5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});