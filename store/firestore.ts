import type { Timestamp, FieldValue } from "firebase/firestore";

export type RideStatus = "open" | "full" | "cancelled" | "completed";
export type RideRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type LiftRequestStatus = "open" | "matched" | "cancelled" | "expired";

export type GeoLite = {
  geohash: string;
  lat: number;
  lng: number;
  label?: string;
};

export type TimeWindow = {
  earliestAt: Timestamp;
  latestAt: Timestamp;
};

export type BaseDoc = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------- RIDES (Driver offers seats) ----------
export type Ride = BaseDoc & {
  driverId: string;

  start: GeoLite;
  destination: GeoLite;

  pickupWindow: TimeWindow;

  departAt?: Timestamp;

  dateKey: string; // "YYYY-MM-DD"

  seatsTotal: number;
  seatsAvailable: number;

  status: RideStatus;

  notes?: string;
};

// For Firestore writes (serverTimestamp fields)
export type RideCreateInput = Omit<Ride, "createdAt" | "updatedAt"> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// ---------- RIDE REQUESTS (Passenger requests to join a specific ride) ----------
export type RideRequest = BaseDoc & {
  rideId: string;
  driverId: string;
  passengerId: string;

  status: RideRequestStatus;

  pickup: GeoLite;

  seatsRequested: number; // usually 1
  message?: string;
};

export type RideRequestCreateInput = Omit<RideRequest, "createdAt" | "updatedAt"> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// ---------- LIFT REQUESTS (Passenger broadcasts "I need a lift") ----------
export type LiftRequest = BaseDoc & {
  passengerId: string;

  pickup: GeoLite;
  destination: GeoLite;

  pickupWindow: TimeWindow;
  dateKey: string;

  seatsRequested: number; // usually 1

  status: LiftRequestStatus;

  message?: string;
};

export type LiftRequestCreateInput = Omit<LiftRequest, "createdAt" | "updatedAt"> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

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