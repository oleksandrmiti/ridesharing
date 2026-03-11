import React, { useState } from "react";
import { Modal, View, Text, Pressable, Alert, StyleSheet, TextInput } from "react-native";
import * as Location from "expo-location";
import ngeohash from "ngeohash";
import type { GeoLite } from "../store/firestore";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (geo: GeoLite) => void;
};

const round = (v: number, decimals: number) =>
  Math.round(v * 10 ** decimals) / 10 ** decimals;

const GEOHASH_PRECISION = 6;

export default function LocationPickerModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  const [label, setLabel] = useState("");

  const onUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Location permission is required.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = round(pos.coords.latitude, 2);   // privacy rounding
      const lng = round(pos.coords.longitude, 2);

      const geohash = ngeohash.encode(
        pos.coords.latitude,
        pos.coords.longitude,
        GEOHASH_PRECISION
      );

      onSelect({
        label: label.trim() || "Current area",
        lat,
        lng,
        geohash,
      });

      onClose();
    } catch (e: any) {
      Alert.alert("Failed to get location", e?.message ?? "Unknown error");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Select Location</Text>

          <TextInput
            placeholder="Label (e.g., Home)"
            value={label}
            onChangeText={setLabel}
            style={styles.input}
          />

          <Pressable style={styles.button} onPress={onUseCurrentLocation}>
            <Text>Use my current area</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={onClose}>
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
    justifyContent: "flex-end",
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    padding: 16,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
});
