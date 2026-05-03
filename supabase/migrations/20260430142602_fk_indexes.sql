CREATE INDEX IF NOT EXISTS categories_trip_id_idx ON public.categories (trip_id);
CREATE INDEX IF NOT EXISTS items_created_by_idx ON public.items (created_by);
CREATE INDEX IF NOT EXISTS trip_invitations_accepted_by_idx ON public.trip_invitations (accepted_by);
CREATE INDEX IF NOT EXISTS trip_invitations_invited_by_idx ON public.trip_invitations (invited_by);
CREATE INDEX IF NOT EXISTS trips_destination_id_idx ON public.trips (destination_id);
