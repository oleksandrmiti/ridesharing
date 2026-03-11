import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  ride: {
    id: string;
    start: { label?: string };
    destination: { label?: string };
    pickupWindow: {
      earliestAt: any;
      latestAt: any;
    };
    seatsAvailable: number;
    seatsTotal: number;
    notes?: string;
    dateKey: string;
  };
  onPress?: () => void;
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

export default function RideCard({ ride, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.from}>{ride.start?.label ?? 'Unknown start'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ride.seatsAvailable}/{ride.seatsTotal} seats
          </Text>
        </View>
      </View>

      <Text style={styles.arrow}>→ {ride.destination?.label ?? 'Destination'}</Text>

      <Text style={styles.time}>
        {ride.dateKey} · {formatTime(ride.pickupWindow?.earliestAt)} -{' '}
        {formatTime(ride.pickupWindow?.latestAt)}
      </Text>

      {ride.notes ? <Text style={styles.notes}>{ride.notes}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  from: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  arrow: {
    fontSize: 15,
    color: '#374151',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    color: '#4B5563',
  },
  badge: {
    backgroundColor: '#EEE8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#6D5EF5',
    fontWeight: '700',
    fontSize: 12,
  },
});