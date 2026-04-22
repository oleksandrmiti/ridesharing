import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';

type Props = {
  request: {
    id: string;
    pickup: { label?: string };
    destination: { label?: string };
    pickupWindow: {
      earliestAt: any;
      latestAt: any;
    };
    seatsRequested: number;
    message?: string;
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

export default function LiftRequestCard({ request, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.from}>{request.pickup?.label ?? 'Unknown start'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{request.seatsRequested} seat(s)</Text>
        </View>
      </View>

      <Text style={styles.arrow}>→ {request.destination?.label ?? 'Destination'}</Text>

      <Text style={styles.time}>
        {request.dateKey} · {formatTime(request.pickupWindow?.earliestAt)} -{' '}
        {formatTime(request.pickupWindow?.latestAt)}
      </Text>

      {request.message ? <Text style={styles.notes}>{request.message}</Text> : null}
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
});