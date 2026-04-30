import { addDoc, collection, serverTimestamp, Timestamp, doc, getDoc, getDocs, updateDoc, increment, writeBatch, limit, where, query } from "firebase/firestore";
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

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
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

export async function cancelRide(rideId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const rideRef = doc(db, 'rides', rideId);
  const snap = await getDoc(rideRef);

  if (!snap.exists()) throw new Error('Ride not found');

  const ride = snap.data() as any;
  if (ride.driverId !== user.uid) throw new Error('Only the driver can cancel this ride');

  await updateDoc(rideRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

export async function cancelLiftRequest(liftRequestId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const ref = doc(db, 'liftRequests', liftRequestId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('Lift request not found');

  const data = snap.data() as any;
  if (data.passengerId !== user.uid) {
    throw new Error('Only the passenger can cancel this lift request');
  }

  await updateDoc(ref, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

export async function acceptRideRequest(params: {
  requestId: string;
  rideId: string;
  seatsRequested: number;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const rideRef = doc(db, 'rides', params.rideId);
  const requestRef = doc(db, 'rideRequests', params.requestId);

  const rideSnap = await getDoc(rideRef);
  const requestSnap = await getDoc(requestRef);

  if (!rideSnap.exists()) throw new Error('Ride not found');
  if (!requestSnap.exists()) throw new Error('Request not found');

  const ride = rideSnap.data() as any;
  const request = requestSnap.data() as any;

  if (ride.driverId !== user.uid) {
    throw new Error('Only the driver can accept this request');
  }

  if (request.status !== 'pending') {
    throw new Error('This request is no longer pending');
  }

  if (ride.seatsAvailable < params.seatsRequested) {
    throw new Error('Not enough seats available');
  }

  const nextSeats = ride.seatsAvailable - params.seatsRequested;

  const batch = writeBatch(db);

  batch.update(requestRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  batch.update(rideRef, {
    seatsAvailable: increment(-params.seatsRequested),
    status: nextSeats <= 0 ? 'full' : 'open',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function rejectRideRequest(requestId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const ref = doc(db, 'rideRequests', requestId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('Request not found');

  const data = snap.data() as any;
  if (data.driverId !== user.uid) {
    throw new Error('Only the driver can reject this request');
  }

  await updateDoc(ref, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function acceptLiftOffer(params: {
  offerId: string;
  liftRequestId: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const offerRef = doc(db, 'liftOffers', params.offerId);
  const requestRef = doc(db, 'liftRequests', params.liftRequestId);

  const offerSnap = await getDoc(offerRef);
  const requestSnap = await getDoc(requestRef);

  if (!offerSnap.exists()) throw new Error('Offer not found');
  if (!requestSnap.exists()) throw new Error('Lift request not found');

  const offer = offerSnap.data() as any;
  const request = requestSnap.data() as any;

  if (request.passengerId !== user.uid) {
    throw new Error('Only the passenger can accept this offer');
  }

  if (offer.status !== 'pending') {
    throw new Error('This offer is no longer pending');
  }

  const batch = writeBatch(db);

  batch.update(offerRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  batch.update(requestRef, {
    status: 'matched',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function rejectLiftOffer(offerId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const ref = doc(db, 'liftOffers', offerId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('Offer not found');

  const data = snap.data() as any;
  if (data.passengerId !== user.uid) {
    throw new Error('Only the passenger can reject this offer');
  }

  await updateDoc(ref, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
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
  const driverRating =
  typeof userData?.ratingAvg === 'number' ? userData.ratingAvg : null;

  const payload: RideCreateInput = {
    driverId: user.uid,
    
    driverName,
    driverRating,

    start: params.start,
    destination: params.destination,

    arrivalWindow: {
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
  driverName?: string | null;
  pickup: GeoLite;
  passengerPhone?: string | null;
  seatsRequested: number;
  message?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const existingRequestQuery = query(
    collection(db, 'rideRequests'),
    where('rideId', '==', params.rideId),
    where('passengerId', '==', user.uid),
    where('status', 'in', ['pending', 'accepted']),
    limit(1)
  );

  const existingRequestSnap = await getDocs(existingRequestQuery);

  if (!existingRequestSnap.empty) {
    throw new Error('You have already requested or joined this ride.');
  }

  const rideSnap = await getDoc(doc(db, 'rides', params.rideId));
  if (!rideSnap.exists()) throw new Error('Ride not found');

  const rideData = rideSnap.data() as any;

  const pickupDistanceKm =
    rideData?.start && params.pickup
      ? distanceKm(rideData.start, params.pickup)
      : null;

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userSnap.exists() ? (userSnap.data() as any) : null;

  const passengerName = userData?.displayName?.trim() || 'Unknown passenger';
  const passengerPhone = params.passengerPhone ?? userData?.phone?.trim?.() ?? null;

  const payload: RideRequestCreateInput = {
    rideId: params.rideId,
    driverId: params.driverId,
    driverName: params.driverName ?? null,

    passengerId: user.uid,
    passengerName,
    passengerPhone,

    status: 'pending',
    pickup: params.pickup,
    pickupDistanceKm,

    seatsRequested: params.seatsRequested,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const trimmedMessage = params.message?.trim();
  if (trimmedMessage) {
    payload.message = trimmedMessage;
  }

  const ref = await addDoc(collection(db, 'rideRequests'), payload);
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
    arrivalWindow: {
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
    passengerName: params.passengerName?.trim() || null,
    start: params.start,
    destination: params.destination,
    arrivalWindow: {
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