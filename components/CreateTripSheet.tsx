import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapPickerModal from './MapPickerModal';
import LocationSelectModal from './LocationSelectModal';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { GeoLite } from '../store/firestore';

type CreateMode = 'DRIVER_RIDE' | 'LIFT_REQUEST';

type Props = {
  defaultPickup?: GeoLite | null;
  defaultDestination: GeoLite;
  onCreateDriverRide: (draft: DriverRideDraft) => Promise<void>;
  onCreateLiftRequest: (draft: LiftRequestDraft) => Promise<void>;
  onClose: () => void;
};

export type DriverRideDraft = {
  start: GeoLite | null;
  destination: GeoLite | null;
  date: Date | null;
  earliest: Date | null;
  latest: Date | null;
  seatsTotal: number;
  notes: string;
};

export type LiftRequestDraft = {
  pickup: GeoLite | null;
  destination: GeoLite | null;
  date: Date | null;
  earliest: Date | null;
  latest: Date | null;
  seatsRequested: number;
  message: string;
};

type PickerMode = 'date' | 'earliest' | 'latest' | null;

function combineDateAndTime(baseDate: Date, timeSource: Date) {
  const result = new Date(baseDate);
  result.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return result;
}

function formatDate(value: Date | null) {
  if (!value) return 'Choose date';
  return value.toLocaleDateString();
}

function formatTime(value: Date | null) {
  if (!value) return 'Set time';
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CreateTripSheet({
  defaultPickup = null,
  defaultDestination,
  onCreateDriverRide,
  onCreateLiftRequest,
  onClose,
}: Props) {
  const [mode, setMode] = useState<CreateMode>('DRIVER_RIDE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [locationSelectOpen, setLocationSelectOpen] = useState(false);

  const [from, setFrom] = useState<GeoLite | null>(defaultPickup);
  const [to] = useState<GeoLite | null>(defaultDestination);

  const [date, setDate] = useState<Date | null>(new Date());
  const [earliest, setEarliest] = useState<Date | null>(null);
  const [latest, setLatest] = useState<Date | null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());

  const [seatsTotal, setSeatsTotal] = useState(1);
  const [notes, setNotes] = useState('');

  const [seatsRequested, setSeatsRequested] = useState(1);
  const [message, setMessage] = useState('');

  const title = useMemo(
    () => (mode === 'DRIVER_RIDE' ? 'Offer a ride' : 'Request a lift'),
    [mode]
  );

  const validateCommon = () => {
    if (!from) return 'Please choose a starting area.';
    if (!to) return 'Please choose a destination.';
    if (!date) return 'Please choose a date.';
    if (!earliest || !latest) return 'Please set an earliest and latest pickup time.';
    if (earliest.getTime() > latest.getTime()) {
      return 'Earliest time must be before latest time.';
    }
    return null;
  };

  const onSubmit = async () => {
    setError(null);
    const commonError = validateCommon();
    if (commonError) return setError(commonError);

    try {
      setBusy(true);

      if (mode === 'DRIVER_RIDE') {
        await onCreateDriverRide({
          start: from,
          destination: to,
          date,
          earliest,
          latest,
          seatsTotal,
          notes,
        });
      } else {
        await onCreateLiftRequest({
          pickup: from,
          destination: to,
          date,
          earliest,
          latest,
          seatsRequested,
          message,
        });
      }

      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create.');
    } finally {
      setBusy(false);
    }
  };

  const openDatePicker = () => {
    setPickerValue(date ?? new Date());
    setPickerMode('date');
  };

  const openEarliestPicker = () => {
    setPickerValue(earliest ?? date ?? new Date());
    setPickerMode('earliest');
  };

  const openLatestPicker = () => {
    setPickerValue(latest ?? earliest ?? date ?? new Date());
    setPickerMode('latest');
  };

  const applyPickerValue = (selected: Date) => {
  if (pickerMode === 'date') {
    const nextDate = selected;
    setDate(nextDate);

    if (earliest) setEarliest(combineDateAndTime(nextDate, earliest));
    if (latest) setLatest(combineDateAndTime(nextDate, latest));
    return;
  }

  if (!date) return;

  if (pickerMode === 'earliest') {
    setEarliest(combineDateAndTime(date, selected));
    return;
  }

  if (pickerMode === 'latest') {
    setLatest(combineDateAndTime(date, selected));
  }
};

  const onChangePicker = (_event: any, selected?: Date) => {
    if (!selected) return;

    if (Platform.OS === 'android') {
      applyPickerValue(selected);
      setPickerMode(null);
      return;
    }

    // iOS: keep temporary value until Done is pressed
    setPickerValue(selected);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.label}>Today I'm...</Text>
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setMode('DRIVER_RIDE')}
          style={[
            styles.toggleButton,
            mode === 'DRIVER_RIDE' && styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'DRIVER_RIDE' && styles.toggleTextActive,
            ]}
          >
            Driver
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('LIFT_REQUEST')}
          style={[
            styles.toggleButton,
            mode === 'LIFT_REQUEST' && styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'LIFT_REQUEST' && styles.toggleTextActive,
            ]}
          >
            Passenger
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Location</Text>
        <Pressable onPress={() => setLocationSelectOpen(true)} style={styles.inputButton}>
          <Text style={{ color: from ? '#111' : '#999' }}>
            {from?.label ?? 'Choose starting area'}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Destination</Text>
        <View style={styles.inputButton}>
          <Text style={{ color: '#111' }}>{to?.label ?? 'MTU Bishopstown'}</Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Date</Text>
        <Pressable onPress={openDatePicker} style={styles.inputButton}>
          <Text>{formatDate(date)}</Text>
        </Pressable>
      </View>

      <View style={styles.timeRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.label}>Earlieast arriving</Text>
          <Pressable onPress={openEarliestPicker} style={styles.inputButton}>
            <Text>{formatTime(earliest)}</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.label}>Latest arriving</Text>
          <Pressable onPress={openLatestPicker} style={styles.inputButton}>
            <Text>{formatTime(latest)}</Text>
          </Pressable>
        </View>
      </View>

      {mode === 'DRIVER_RIDE' ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Seats available</Text>

          <View style={styles.seatRow}>
            {[1, 2, 3].map((seat) => (
              <Pressable
                key={seat}
                onPress={() => setSeatsTotal(seat)}
                style={[
                  styles.seatButton,
                  seatsTotal === seat && styles.seatButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.seatButtonText,
                    seatsTotal === seat && styles.seatButtonTextActive,
                  ]}
                >
                  {seat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <BottomSheetTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Car / meeting notes"
            multiline
            style={[styles.inputButton, { minHeight: 90, textAlignVertical: 'top' }]}
          />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Seats needed</Text>

          <View style={styles.seatRow}>
            {[1, 2, 3].map((seat) => (
              <Pressable
                key={seat}
                onPress={() => setSeatsRequested(seat)}
                style={[
                  styles.seatButton,
                  seatsRequested === seat && styles.seatButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.seatButtonText,
                    seatsRequested === seat && styles.seatButtonTextActive,
                  ]}
                >
                  {seat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Message</Text>
          <BottomSheetTextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Any notes for drivers"
            multiline
            style={[styles.inputButton, { minHeight: 90, textAlignVertical: 'top' }]}
          />
        </View>
      )}

      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

      <Pressable
        disabled={busy}
        onPress={onSubmit}
        style={[styles.primaryButton, busy && { opacity: 0.6 }]}
      >
        <Text style={styles.primaryButtonText}>Create Request</Text>
      </Pressable>

      <Pressable disabled={busy} onPress={onClose} style={styles.secondaryButton}>
        <Text>Cancel</Text>
      </Pressable>

      <Modal visible={pickerMode !== null} transparent animationType="fade">
        <View style={pickerStyles.backdrop}>
          <View style={pickerStyles.card}>
            <Text style={pickerStyles.title}>
              {pickerMode === 'date'
                ? 'Select date'
                : pickerMode === 'earliest'
                ? 'Select earliest time to arrive'
                : 'Select latest time to arrive'}
            </Text>

            <DateTimePicker
              value={pickerValue}
              mode={pickerMode === 'date' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangePicker}
            />

            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => {
                  applyPickerValue(pickerValue);
                  setPickerMode(null);
                }}
                style={pickerStyles.doneButton}
              >
                <Text style={pickerStyles.doneText}>Done</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <LocationSelectModal
        visible={locationSelectOpen}
        onClose={() => setLocationSelectOpen(false)}
        onSelect={(geo) => setFrom(geo)}
        onOpenMap={() => setMapOpen(true)}
      />

      <MapPickerModal
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(geo) => setFrom(geo)}
      />
    </View>
    </TouchableWithoutFeedback>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#6D5EF5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1F2A44',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  toggleButtonActive: {
    backgroundColor: '#E9E3FF',
  },
  toggleText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#6D5EF5',
    fontWeight: '700',
  },
  inputButton: {
    borderWidth: 1,
    borderColor: '#E3E7EF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  seatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  seatButton: {
    minWidth: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
  },
  seatButtonActive: {
    backgroundColor: '#E9E3FF',
  },
  seatButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  seatButtonTextActive: {
    color: '#6D5EF5',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#6D5EF5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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