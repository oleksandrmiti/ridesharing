import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import { auth, db } from '../../utils/firebase';

type SectionKey = 'MY_RIDES' | 'MY_REQUESTS' | 'MY_LIFT_REQUESTS' | 'INVITES';

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

export default function MyTripsScreen() {
  const navigation = useNavigation<any>();
  const uid = auth.currentUser?.uid;

  const [active, setActive] = useState<SectionKey>('MY_RIDES');
  const [loading, setLoading] = useState(true);

  const [myRides, setMyRides] = useState<any[]>([]);
  const [myRideRequests, setMyRideRequests] = useState<any[]>([]);
  const [myLiftRequests, setMyLiftRequests] = useState<any[]>([]);
  const [incomingRideRequests, setIncomingRideRequests] = useState<any[]>([]);
  const [incomingLiftOffers, setIncomingLiftOffers] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    const unsubscribers: Array<() => void> = [];

    const subscribe = (
      q: any,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      label: string
    ) => {
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          setter(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (error) => {
          console.error(`Failed to load ${label}:`, error);
          Alert.alert(`Failed to load ${label}`, error.message ?? 'Unknown error');
          setLoading(false);
        }
      );

      unsubscribers.push(unsub);
    };

    subscribe(
      query(
        collection(db, 'rides'),
        where('driverId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      setMyRides,
      'my rides'
    );

    subscribe(
      query(
        collection(db, 'rideRequests'),
        where('passengerId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      setMyRideRequests,
      'my ride requests'
    );

    subscribe(
      query(
        collection(db, 'liftRequests'),
        where('passengerId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      setMyLiftRequests,
      'my lift requests'
    );

    subscribe(
      query(
        collection(db, 'rideRequests'),
        where('driverId', '==', uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
      setIncomingRideRequests,
      'incoming ride requests'
    );

    subscribe(
      query(
        collection(db, 'liftOffers'),
        where('passengerId', '==', uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
      setIncomingLiftOffers,
      'incoming lift offers'
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [uid]);

  const invites = [...incomingRideRequests, ...incomingLiftOffers];

  const data =
    active === 'MY_RIDES'
      ? myRides
      : active === 'MY_REQUESTS'
      ? myRideRequests
      : active === 'MY_LIFT_REQUESTS'
      ? myLiftRequests
      : invites;

  const renderItem = ({ item }: { item: any }) => {
    if (active === 'MY_RIDES') {
      return (
        <TripCard
          title={`${item.start?.label ?? 'Start'} → ${item.destination?.label ?? 'Destination'}`}
          subtitle={`${item.dateKey} · ${formatTime(item.arrivalWindow?.earliestAt)} - ${formatTime(
            item.arrivalWindow?.latestAt
          )}`}
          badge={item.status}
          footer={`${item.seatsAvailable}/${item.seatsTotal} seats available`}
          onPress={() => navigation.navigate('RideDetails', { rideId: item.id })}
        />
      );
    }

    if (active === 'MY_REQUESTS') {
      return (
        <TripCard
          title={`Request to join ride`}
          subtitle={`Status: ${item.status}`}
          badge={item.status}
          footer={`Seats requested: ${item.seatsRequested}`}
          onPress={() => {
            if (item.rideId) {
              navigation.navigate('RideDetails', { rideId: item.rideId });
            }
          }}
        />
      );
    }

    if (active === 'MY_LIFT_REQUESTS') {
      return (
        <TripCard
          title={`${item.pickup?.label ?? 'Pickup'} → ${item.destination?.label ?? 'Destination'}`}
          subtitle={`${item.dateKey} · ${formatTime(item.arrivalWindow?.earliestAt)} - ${formatTime(
            item.arrivalWindow?.latestAt
          )}`}
          badge={item.status}
          footer={`Seats needed: ${item.seatsRequested}`}
          onPress={() =>
            navigation.navigate('LiftRequestDetails', {
              liftRequestId: item.id,
            })
          }
        />
      );
    }

    const isRideRequest = !!item.rideId;

    return (
      <TripCard
        title={isRideRequest ? 'Passenger wants to join your ride' : 'Driver sent you a lift offer'}
        subtitle={`Status: ${item.status}`}
        badge={item.status}
        footer={
          isRideRequest
            ? `Passenger: ${item.passengerName ?? item.passengerId ?? 'Unknown'}`
            : `Driver: ${item.driverName ?? item.driverId ?? 'Unknown'}`
        }
        onPress={() => {
          if (isRideRequest && item.rideId) {
            navigation.navigate('RideDetails', { rideId: item.rideId });
          } else if (item.liftRequestId) {
            navigation.navigate('LiftRequestDetails', {
              liftRequestId: item.liftRequestId,
            });
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>My Trips</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          <TabButton label="My Rides" active={active === 'MY_RIDES'} onPress={() => setActive('MY_RIDES')} />
          <TabButton label="Requests Sent" active={active === 'MY_REQUESTS'} onPress={() => setActive('MY_REQUESTS')} />
          <TabButton
            label="Lift Requests"
            active={active === 'MY_LIFT_REQUESTS'}
            onPress={() => setActive('MY_LIFT_REQUESTS')}
          />
          <TabButton label="Invites" active={active === 'INVITES'} onPress={() => setActive('INVITES')} />
        </ScrollView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.helperText}>Loading trips...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.helperText}>Your trips and requests will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function TripCard({
  title,
  subtitle,
  badge,
  footer,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  footer?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {footer ? <Text style={styles.cardFooter}>{footer}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingBottom: -40, },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: -10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  tabs: {
    flexGrow: 0,
    marginBottom: 14,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#E9E3FF',
  },
  tabText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#6D5EF5',
  },
  listContent: {
    gap: 12,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    color: '#6B7280',
  },
  cardFooter: {
    color: '#374151',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#EEE8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#6D5EF5',
    fontWeight: '700',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  helperText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});