import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { createLiftOffer } from '../../utils/firestoreWrites';
import { db, auth } from '../../utils/firebase';

type Props = {
  route: {
    params: {
      liftRequestId: string;
    };
  };
};

type LiftRequestDetailsData = {
  id: string;
  passengerId: string;
  passengerName?: string;
  pickup: {
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
  arrivalWindow: {
    earliestAt: any;
    latestAt: any;
  };
  seatsRequested: number;
  status: 'open' | 'matched' | 'cancelled' | 'expired';
  message?: string;
  dateKey: string;
};

function formatTime(ts: any) {
  if (!ts) return '--:--';

  const date =
    typeof ts?.toDate === 'function'
      ? ts.toDate()
      : ts instanceof Date
      ? ts
      : new Date(ts);

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LiftRequestDetails({ route }: Props) {
  const { liftRequestId } = route.params;
  const navigation = useNavigation<any>();

  const [request, setRequest] = useState<LiftRequestDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingRide, setCreatingRide] = useState(false);

  useEffect(() => {
    const loadLiftRequest = async () => {
      try {
        const requestSnap = await getDoc(doc(db, 'liftRequests', liftRequestId));

        if (!requestSnap.exists()) {
          Alert.alert('Lift request not found');
          navigation.goBack();
          return;
        }

        const requestData = {
          id: requestSnap.id,
          ...(requestSnap.data() as Omit<LiftRequestDetailsData, 'id'>),
        };

        setRequest(requestData);
      } catch (e: any) {
        Alert.alert('Failed to load lift request', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadLiftRequest();
  }, [liftRequestId, navigation]);

  const onSendOffer = async () => {
    if (!request) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('You need to be signed in.');
      return;
    }

    if (user.uid === request.passengerId) {
      Alert.alert('This is your own lift request.');
      return;
    }

    if (request.status !== 'open') {
      Alert.alert('This lift request is no longer open.');
      return;
    }

    try {
      setCreatingRide(true);

      const earliestDate =
        typeof request.arrivalWindow?.earliestAt?.toDate === 'function'
          ? request.arrivalWindow.earliestAt.toDate()
          : new Date(request.arrivalWindow?.earliestAt);

      const latestDate =
        typeof request.arrivalWindow?.latestAt?.toDate === 'function'
          ? request.arrivalWindow.latestAt.toDate()
          : new Date(request.arrivalWindow?.latestAt);

      await createLiftOffer({
        liftRequestId: request.id,
        passengerId: request.passengerId,
        passengerName: request.passengerName,
        start: request.pickup,
        destination: request.destination,
        earliestAt: earliestDate,
        latestAt: latestDate,
        date: earliestDate,
        seatsOffered: request.seatsRequested,
        message: '',
      });

      Alert.alert('Offer sent', 'Your lift offer has been sent to the passenger.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed to send offer', e?.message ?? 'Unknown error');
    } finally {
      setCreatingRide(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading lift request...</Text>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Lift request not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Lift Request Details</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Passenger name</Text>
          <Text style={styles.value}>
            {request.passengerName?.trim() ? request.passengerName : 'Unknown passenger'}
          </Text>

          <Text style={styles.sectionLabel}>From</Text>
          <Text style={styles.value}>{request.pickup?.label ?? 'Unknown start'}</Text>

          <Text style={styles.sectionLabel}>To</Text>
          <Text style={styles.value}>{request.destination?.label ?? 'Unknown destination'}</Text>

          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.value}>{request.dateKey}</Text>

          <Text style={styles.sectionLabel}>Pickup window</Text>
          <Text style={styles.value}>
            {formatTime(request.arrivalWindow?.earliestAt)} -{' '}
            {formatTime(request.arrivalWindow?.latestAt)}
          </Text>

          <Text style={styles.sectionLabel}>Seats requested</Text>
          <Text style={styles.value}>{request.seatsRequested}</Text>

          <Text style={styles.sectionLabel}>Status</Text>
          <Text style={styles.value}>{request.status}</Text>

          {request.message ? (
            <>
              <Text style={styles.sectionLabel}>Message</Text>
              <Text style={styles.value}>{request.message}</Text>
            </>
          ) : null}
        </View>

        <Pressable
          onPress={onSendOffer}
          disabled={creatingRide || request.status !== 'open'}
          style={[
            styles.primaryButton,
            (creatingRide || request.status !== 'open') && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {creatingRide ? 'Sending offer...' : 'Send Offer'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={styles.secondaryButton}>
          <Text>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  sectionLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#6D5EF5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});