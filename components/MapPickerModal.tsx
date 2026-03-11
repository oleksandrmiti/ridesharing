import React, { useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MapView, { Region } from 'react-native-maps';
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

  const onSave = () => {
    const lat = round(region.latitude, 2);
    const lng = round(region.longitude, 2);

    onConfirm({
      label: 'Selected area',
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

        {/* fixed center pin */}
        <View pointerEvents="none" style={styles.pinContainer}>
          <Text style={styles.pin}>📍</Text>
        </View>

        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.topButton}>
            <Text>Close</Text>
          </Pressable>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.title}>Choose pickup area</Text>
          <Text style={styles.coords}>
            {latLabel(region.latitude)}, {lngLabel(region.longitude)}
          </Text>

          <Pressable onPress={onSave} style={styles.confirmButton}>
            <Text style={styles.confirmText}>Confirm location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function latLabel(v: number) {
  return v.toFixed(4);
}

function lngLabel(v: number) {
  return v.toFixed(4);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  pin: {
    fontSize: 32,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
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