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
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import { createRideRequest, cancelRide, acceptRideRequest, rejectRideRequest } from '../../utils/firestoreWrites';
import { useNavigation } from '@react-navigation/native';

type Props = {
  route: {
    params: {
      rideId: string;
    };
  };
  navigation: any;
};

type RideDetailsData = {
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
  arrivalWindow: {
    earliestAt: any;
    latestAt: any;
  };
  seatsTotal: number;
  seatsAvailable: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  notes?: string;
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

export default function RideDetails({ route }: Props) {
  const { rideId } = route.params;
  const navigation = useNavigation<any>();
  const [ride, setRide] = useState<RideDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid === ride?.driverId;
  const [myRequestStatus, setMyRequestStatus] = useState<string | null>(null);
  const alreadyRequestedOrJoined = myRequestStatus === 'pending' || myRequestStatus === 'accepted';

  useEffect(() => {
    const loadRide = async () => {
      try {
        const snap = await getDoc(doc(db, 'rides', rideId));

        if (!snap.exists()) {
          Alert.alert('Ride not found');
          navigation.goBack();
          return;
        }

        setRide({
          id: snap.id,
          ...(snap.data() as Omit<RideDetailsData, 'id'>),
        });
      } catch (e: any) {
        Alert.alert('Failed to load ride', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadRide();
  }, [rideId, navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !rideId) return;

    const q = query(
      collection(db, 'rideRequests'),
      where('rideId', '==', rideId),
      where('passengerId', '==', user.uid),
      where('status', 'in', ['pending', 'accepted']),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setMyRequestStatus(null);
      } else {
        setMyRequestStatus((snapshot.docs[0].data() as any).status);
      }
    });

    return unsub;
  }, [rideId]);

  useEffect(() => {
    const q = query(
      collection(db, 'rideRequests'),
      where('rideId', '==', rideId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [rideId]);

  const onRequestToJoin = async () => {
    if (!ride) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('You need to be signed in.');
      return;
    }

    if (user.uid === ride.driverId) {
      Alert.alert('This is your own ride.');
      return;
    }

    if (ride.status !== 'open') {
      Alert.alert('This ride is no longer open.');
      return;
    }

    if (ride.seatsAvailable < 1) {
      Alert.alert('No seats available.');
      return;
    }

    try {
      setJoining(true);

      await createRideRequest({
        rideId: ride.id,
        driverId: ride.driverId,
        driverName: ride.driverName,
        pickup: ride.start,
        seatsRequested: 1,
        message: '',
      });

      Alert.alert('Request sent', 'Your request to join this ride has been sent.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed to send request', e?.message ?? 'Unknown error');
    } finally {
      setJoining(false);
    }
  };

  const onCancelRide = async () => {
    if (!ride) return;

    try {
      await cancelRide(ride.id);
      Alert.alert('Cancelled', 'Ride cancelled.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed to cancel ride', e?.message ?? 'Unknown error');
    }
  };

  const onAcceptRequest = async (request: any) => {
    if (!ride) return;

    try {
      await acceptRideRequest({
        requestId: request.id,
        rideId: ride.id,
        seatsRequested: request.seatsRequested,
      });

      Alert.alert('Request accepted');
    } catch (e: any) {
      Alert.alert('Failed to accept request', e?.message ?? 'Unknown error');
    }
  };

  const onRejectRequest = async (request: any) => {
    try {
      await rejectRideRequest(request.id);
    } catch (e: any) {
      Alert.alert('Failed to reject request', e?.message ?? 'Unknown error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading ride...</Text>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Ride not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Ride Details</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Driver name</Text>
          <Text style={styles.value}>{ride.driverName}</Text>

          <Text style={styles.sectionLabel}>From</Text>
          <Text style={styles.value}>{ride.start?.label ?? 'Unknown start'}</Text>

          <Text style={styles.sectionLabel}>To</Text>
          <Text style={styles.value}>{ride.destination?.label ?? 'Unknown destination'}</Text>

          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.value}>{ride.dateKey}</Text>

          <Text style={styles.sectionLabel}>Arrival window</Text>
          <Text style={styles.value}>
            {formatTime(ride.arrivalWindow?.earliestAt)} - {formatTime(ride.arrivalWindow?.latestAt)}
          </Text>

          <Text style={styles.sectionLabel}>Seats</Text>
          <Text style={styles.value}>
            {ride.seatsAvailable}/{ride.seatsTotal}
          </Text>

          <Text style={styles.sectionLabel}>Status</Text>
          <Text style={styles.value}>{ride.status}</Text>

          {ride.notes ? (
            <>
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text style={styles.value}>{ride.notes}</Text>
            </>
          ) : null}
        </View>

        {isOwner ? (
          <>
            <Text style={styles.sectionTitle}>Manage Ride</Text>

            {ride.status === 'open' || ride.status === 'full' ? (
              <Pressable onPress={onCancelRide} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Cancel Ride</Text>
              </Pressable>
            ) : null}

            <Text style={styles.sectionTitle}>Passenger Requests</Text>

            {requests.length === 0 ? (
              <Text style={styles.helperText}>No passenger requests yet.</Text>
            ) : (
              requests.map((request) => (
                <View key={request.id} style={styles.offerCard}>
                  <Text style={styles.value}>
                    Passenger: {request.passengerName ?? 'Unknown passenger'}
                  </Text>

                  <Text style={styles.value}>Status: {request.status}</Text>
                  <Text style={styles.value}>Seats: {request.seatsRequested}</Text>

                  {request.status === 'pending' ? (
                    <View style={styles.actionRow}>
                      <Pressable onPress={() => onAcceptRequest(request)} style={styles.acceptButton}>
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>

                      <Pressable onPress={() => onRejectRequest(request)} style={styles.rejectButton}>
                        <Text style={styles.rejectText}>Reject</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </>
        ) : (
              <Pressable
                onPress={onRequestToJoin}
                disabled={
                  joining ||
                  ride.status !== 'open' ||
                  ride.seatsAvailable < 1 ||
                  alreadyRequestedOrJoined
                }
                style={[
                  styles.primaryButton,
                  (joining ||
                    ride.status !== 'open' ||
                    ride.seatsAvailable < 1 ||
                    alreadyRequestedOrJoined) && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {joining
                    ? 'Sending request...'
                    : myRequestStatus === 'pending'
                    ? 'Request Pending'
                    : myRequestStatus === 'accepted'
                    ? 'Already Joined'
                    : 'Request to Join'}
                </Text>
              </Pressable>
            )}

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  helperText: {
    color: '#6B7280',
  },
  offerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#15803D',
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: '700',
  },
});