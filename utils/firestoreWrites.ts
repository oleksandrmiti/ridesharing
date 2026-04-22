import { addDoc, collection, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import ngeohash from "ngeohash";

import { auth, db } from "../utils/firebase";
import type { GeoLite, RideCreateInput, RideRequestCreateInput, LiftRequestCreateInput, LiftOfferCreateInput } from "../store/firestore";

// ---- helpers ----

const round = (v: number, decimals: number) =>
  Math.round(v * 10 ** decimals) / 10 ** decimals;

export const GEOHASH_PRECISION = 6;

export function toGeoLite(params: { lat: number; lng: number; label?: string }): GeoLite {
  const lat = round(params.lat, 2);
  const lng = round(params.lng, 2);
  return {
    lat,
    lng,
    geohash: ngeohash.encode(params.lat, params.lng, GEOHASH_PRECISION),
    label: params.label,
  };
}

export function dateKeyFromDate(d: Date): string {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimestamp(d: Date): Timestamp {
  return Timestamp.fromDate(d);
}

// ---- writes ----

export async function createRide(params: {
  start: GeoLite;
  destination: GeoLite;
  earliestAt: Date;
  latestAt: Date;
  date: Date;
  seatsTotal: number;
  notes?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const dateKey = dateKeyFromDate(params.date);

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userSnap.exists() ? userSnap.data() as any : null;
  const driverName = userData?.displayName?.trim() || 'Unknown driver';

  const payload: RideCreateInput = {
    driverId: user.uid,
    
    driverName,

    start: params.start,
    destination: params.destination,

    pickupWindow: {
      earliestAt: toTimestamp(params.earliestAt),
      latestAt: toTimestamp(params.latestAt),
    },

    departAt: toTimestamp(params.earliestAt),

    dateKey,

    seatsTotal: params.seatsTotal,
    seatsAvailable: params.seatsTotal,

    status: "open",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const trimmedNotes = params.notes?.trim();
  if (trimmedNotes) {
    payload.notes = trimmedNotes;
  }

  const ref = await addDoc(collection(db, "rides"), payload);
  return ref.id;
}

export async function createRideRequest(params: {
  rideId: string;
  driverId: string;
  pickup: GeoLite;
  seatsRequested: number;
  message?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const payload: RideRequestCreateInput = {
    rideId: params.rideId,
    driverId: params.driverId,
    passengerId: user.uid,

    status: "pending",

    pickup: params.pickup,

    seatsRequested: params.seatsRequested,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const trimmedMessage = params.message?.trim();
  if (trimmedMessage) {
    payload.message = trimmedMessage;
  }
  const ref = await addDoc(collection(db, "rideRequests"), payload);
  return ref.id;
}

export async function createLiftRequest(params: {
  pickup: GeoLite;
  destination: GeoLite;
  earliestAt: Date;
  latestAt: Date;
  date: Date;
  seatsRequested: number;
  message?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userSnap.exists() ? (userSnap.data() as any) : null;
  const passengerName = userData?.displayName?.trim() || 'Unknown passenger';

  const payload: LiftRequestCreateInput = {
    passengerId: user.uid,
    passengerName,
    pickup: params.pickup,
    destination: params.destination,
    pickupWindow: {
      earliestAt: toTimestamp(params.earliestAt),
      latestAt: toTimestamp(params.latestAt),
    },
    dateKey: dateKeyFromDate(params.date),
    seatsRequested: params.seatsRequested,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const trimmedMessage = params.message?.trim();
  if (trimmedMessage) {
    payload.message = trimmedMessage;
  }

  const ref = await addDoc(collection(db, "liftRequests"), payload);
  return ref.id;
}

export async function createLiftOffer(params: {
  liftRequestId: string;
  passengerId: string;
  passengerName?: string | null;
  start: GeoLite;
  destination: GeoLite;
  earliestAt: Date;
  latestAt: Date;
  date: Date;
  seatsOffered: number;
  message?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userSnap.exists() ? (userSnap.data() as any) : null;
  const driverName = userData?.displayName?.trim() || 'Unknown driver';

  const payload: LiftOfferCreateInput = {
    liftRequestId: params.liftRequestId,
    driverId: user.uid,
    driverName,
    passengerId: params.passengerId,
    passengerName: params.passengerName?.trim() || undefined,
    start: params.start,
    destination: params.destination,
    pickupWindow: {
      earliestAt: toTimestamp(params.earliestAt),
      latestAt: toTimestamp(params.latestAt),
    },
    dateKey: dateKeyFromDate(params.date),
    seatsOffered: params.seatsOffered,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const trimmedMessage = params.message?.trim();
  if (trimmedMessage) {
    payload.message = trimmedMessage;
  }

  const ref = await addDoc(collection(db, 'liftOffers'), payload);
  return ref.id;
}