import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import ngeohash from 'ngeohash';
import { useNavigation } from '@react-navigation/native';
import Fab from '../../components/Fab';
import AppBottomSheet from '../../components/BottomSheetModal';
import CreateTripSheet from '../../components/CreateTripSheet';
import RideCard from '../../components/RideCard';

import type { GeoLite } from '../../store/firestore';
import { db } from '../../utils/firebase';
import { createRide, createLiftRequest } from '../../utils/firestoreWrites';

type RideListItem = {
  id: string;
  driverId: string;
  start: {
    geohash: string;
    lat: number;
    lng: number;
    label?: string;
  };
  destination: {
    geohash: string;
    lat: number;
    lng: number;
    label?: string;
  };
  pickupWindow: {
    earliestAt: any;
    latestAt: any;
  };
  seatsTotal: number;
  seatsAvailable: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  dateKey: string;
};

const Main = () => {
  const sheetRef = useRef<BottomSheet>(null);
  const [sheetOpenKey, setSheetOpenKey] = useState(0);
  const navigation = useNavigation<any>();
  const [rides, setRides] = useState<RideListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultDestination: GeoLite = useMemo(
    () => ({
      label: 'MTU Bishopstown',
      lat: 51.885884,
      lng: -8.533218,
      geohash: ngeohash.encode(51.885884, -8.533218, 6),
    }),
    []
  );

  useEffect(() => {
    const q = query(
      collection(db, 'rides'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next: RideListItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<RideListItem, 'id'>),
        }));

        setRides(next);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load rides:', error);
        Alert.alert('Failed to load rides', error.message ?? 'Unknown error');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const onOpenSheet = () => {
    setSheetOpenKey((prev) => prev + 1);
    sheetRef.current?.snapToIndex(0);
  };

  const onCloseSheet = () => {
    sheetRef.current?.close();
  };

  const onCreateDriverRide = async (draft: any) => {
    await createRide({
      start: draft.start,
      destination: draft.destination,
      date: draft.date,
      earliestAt: draft.earliest,
      latestAt: draft.latest,
      seatsTotal: draft.seatsTotal,
      notes: draft.notes,
    });

    onCloseSheet();
  };

  const onCreateLiftRequest = async (draft: any) => {
    await createLiftRequest({
      pickup: draft.pickup,
      destination: draft.destination,
      date: draft.date,
      earliestAt: draft.earliest,
      latestAt: draft.latest,
      seatsRequested: draft.seatsRequested,
      message: draft.message,
    });

    onCloseSheet();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Available rides</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.helperText}>Loading rides...</Text>
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.helperText}>Tap + to create the first one.</Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <RideCard
                ride={item}
                onPress={() => {
                  navigation.navigate('RideDetails', { rideId: item.id });
                }}
              />
            )}
          />
        )}
      </View>

      <Fab onPress={onOpenSheet} />

      <AppBottomSheet ref={sheetRef}>
        <CreateTripSheet
          key={sheetOpenKey}
          defaultDestination={defaultDestination}
          defaultPickup={null}
          onCreateDriverRide={onCreateDriverRide}
          onCreateLiftRequest={onCreateLiftRequest}
          onClose={onCloseSheet}
        />
      </AppBottomSheet>
    </SafeAreaView>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
  },
});