import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchTrips as fetchTripsService,
  insertTrip,
  softDeleteTrip,
  updateTrip,
} from '../lib/tripsService';
import type { Trip, TripInput } from '../types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTripsData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTripsService();
      setTrips(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTripsData();

    const channel = supabase
      .channel('trips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchTripsData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTripsData]);

  async function addTrip(input: TripInput): Promise<Trip> {
    const data = await insertTrip(input);
    setTrips(prev => [data, ...prev.filter(t => t.id !== data.id)]);
    return data;
  }

  async function editTrip(id: string, updates: Partial<TripInput>): Promise<Trip> {
    const data = await updateTrip(id, updates);
    setTrips(prev => prev.map(t => (t.id === id ? data : t)));
    return data;
  }

  const deleteTrip = useCallback(async (id: string): Promise<void> => {
    await softDeleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }, []);

  const addPlaceToTrip = useCallback(
    async (tripId: string, placeId: string) => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      if (trip.place_ids.includes(placeId)) return;
      const updatedIds = [...trip.place_ids, placeId];
      const updated = await updateTrip(tripId, { place_ids: updatedIds });
      setTrips(prev => prev.map(t => (t.id === tripId ? updated : t)));
    },
    [trips],
  );

  const removePlaceFromTrip = useCallback(
    async (tripId: string, placeId: string) => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      const updatedIds = trip.place_ids.filter(id => id !== placeId);
      const updated = await updateTrip(tripId, { place_ids: updatedIds });
      setTrips(prev => prev.map(t => (t.id === tripId ? updated : t)));
    },
    [trips],
  );

  const togglePlaceInTrip = useCallback(
    async (tripId: string, placeId: string) => {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      const exists = trip.place_ids.includes(placeId);
      const updatedIds = exists
        ? trip.place_ids.filter(id => id !== placeId)
        : [...trip.place_ids, placeId];
      const updated = await updateTrip(tripId, { place_ids: updatedIds });
      setTrips(prev => prev.map(t => (t.id === tripId ? updated : t)));
    },
    [trips],
  );

  return {
    trips,
    loading,
    error,
    addTrip,
    editTrip,
    deleteTrip,
    addPlaceToTrip,
    removePlaceFromTrip,
    togglePlaceInTrip,
    refetch: fetchTripsData,
  };
}
