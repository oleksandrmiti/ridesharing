import type { Timestamp, FieldValue } from 'firebase/firestore';

export type RideStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type RideRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type LiftRequestStatus = 'open' | 'matched' | 'cancelled' | 'expired';
export type LiftOfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type GeoLite = {
  geohash: string;
  lat: number;
  lng: number;
  label?: string;
};

export type SavedPreferredLocation = {
  id: string;
  privateLabel: string;
  publicLabel: string;
  geohash: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type TimeWindow = {
  earliestAt: Timestamp;
  latestAt: Timestamp;
};

export type BaseDoc = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type FirestoreDoc<T> = T & {
  id: string;
};

// ---------- RIDES (Driver offers seats) ----------
export type Ride = BaseDoc & {
  driverId: string;
  driverName?: string | null;
  driverRating?: number | null;

  start: GeoLite;
  destination: GeoLite;

  pickupWindow: TimeWindow;
  departAt?: Timestamp;

  dateKey: string;

  seatsTotal: number;
  seatsAvailable: number;

  status: RideStatus;

  notes?: string;
};

export type RideCreateInput = Omit<Ride, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// ---------- RIDE REQUESTS (Passenger requests to join a specific ride) ----------
export type RideRequest = BaseDoc & {
  rideId: string;

  driverId: string;
  driverName?: string | null;

  passengerId: string;
  passengerName?: string | null;

  status: RideRequestStatus;

  pickup: GeoLite;

  seatsRequested: number;
  message?: string;
};

export type RideRequestCreateInput = Omit<RideRequest, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// ---------- LIFT REQUESTS (Passenger broadcasts "I need a lift") ----------
export type LiftRequest = BaseDoc & {
  passengerId: string;
  passengerName?: string | null;

  pickup: GeoLite;
  destination: GeoLite;

  pickupWindow: TimeWindow;
  dateKey: string;

  seatsRequested: number;

  status: LiftRequestStatus;

  message?: string;
};

export type LiftRequestCreateInput = Omit<LiftRequest, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// ---------- LIFT OFFERS (Driver responds to a lift request) ----------
export type LiftOffer = BaseDoc & {
  liftRequestId: string;

  driverId: string;
  driverName?: string | null;

  passengerId: string;
  passengerName?: string | null;

  start: GeoLite;
  destination: GeoLite;

  pickupWindow: TimeWindow;
  dateKey: string;

  seatsOffered: number;

  status: LiftOfferStatus;

  message?: string;
};

export type LiftOfferCreateInput = Omit<LiftOffer, 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};