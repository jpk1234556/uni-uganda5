-- =========================================================================
-- PHASE 11: RICH ROOM CONTENT
-- Goal: Add images and descriptions directly to individual room types.
-- =========================================================================

ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS description text;

-- (Optional) If we want amenities at the room level later, we could add:
-- ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS amenities text[];
