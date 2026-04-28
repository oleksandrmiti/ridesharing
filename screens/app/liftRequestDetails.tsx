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
import { doc, getDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { createLiftOffer, cancelLiftRequest, acceptLiftOffer, rejectLiftOffer } from '../../utils/firestoreWrites';
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
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid === request?.passengerId;
  const [offers, setOffers] = useState<any[]>([]);

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

  useEffect(() => {
  const q = query(
    collection(db, 'liftOffers'),
    where('liftRequestId', '==', liftRequestId),
    orderBy('createdAt', 'desc')
  );

  const unsub = onSnapshot(q, (snapshot) => {
    setOffers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

  return unsub;
}, [liftRequestId]);

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

  const onCancelLiftRequest = async () => {
  if (!request) return;

  try {
    await cancelLiftRequest(request.id);
    Alert.alert('Cancelled', 'Lift request cancelled.');
    navigation.goBack();
  } catch (e: any) {
    Alert.alert('Failed to cancel', e?.message ?? 'Unknown error');
  }
};

  const onAcceptOffer = async (offer: any) => {
    if (!request) return;

    try {
      await acceptLiftOffer({
        offerId: offer.id,
        liftRequestId: request.id,
      });

      Alert.alert('Offer accepted');
    } catch (e: any) {
      Alert.alert('Failed to accept offer', e?.message ?? 'Unknown error');
    }
  };

  const onRejectOffer = async (offer: any) => {
    try {
      await rejectLiftOffer(offer.id);
    } catch (e: any) {
      Alert.alert('Failed to reject offer', e?.message ?? 'Unknown error');
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
          {isOwner ? (
            <>
              <Text style={styles.sectionTitle}>Manage Lift Request</Text>

              {request.status === 'open' ? (
                <Pressable onPress={onCancelLiftRequest} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Cancel Lift Request</Text>
                </Pressable>
              ) : null}

              <Text style={styles.sectionTitle}>Offers Received</Text>

              {offers.length === 0 ? (
                <Text style={styles.helperText}>No offers yet.</Text>
              ) : (
                offers.map((offer) => (
                  <View key={offer.id} style={styles.offerCard}>
                    <Text style={styles.value}>
                      Driver: {offer.driverName ?? 'Unknown driver'}
                    </Text>

                    <Text style={styles.value}>Status: {offer.status}</Text>
                    <Text style={styles.value}>Seats offered: {offer.seatsOffered}</Text>

                    {offer.message ? <Text style={styles.value}>{offer.message}</Text> : null}

                    {offer.status === 'pending' && request.status === 'open' ? (
                      <View style={styles.actionRow}>
                        <Pressable onPress={() => onAcceptOffer(offer)} style={styles.acceptButton}>
                          <Text style={styles.acceptText}>Accept</Text>
                        </Pressable>

                        <Pressable onPress={() => onRejectOffer(offer)} style={styles.rejectButton}>
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
          )}

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