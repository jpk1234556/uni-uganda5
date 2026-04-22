-- ============================================================
-- PHASE 25: MARKETPLACE CHECKOUT CORE
-- Adds ecommerce-style cart, checkout intents, and inventory holds.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Missing table public.users. Run base migrations before phase25_marketplace_checkout_core.sql.';
  END IF;

  IF to_regclass('public.hostels') IS NULL THEN
    RAISE EXCEPTION 'Missing table public.hostels. Run base migrations before phase25_marketplace_checkout_core.sql.';
  END IF;

  IF to_regclass('public.room_types') IS NULL THEN
    RAISE EXCEPTION 'Missing table public.room_types. Run base migrations before phase25_marketplace_checkout_core.sql.';
  END IF;

  IF to_regclass('public.bookings') IS NULL THEN
    RAISE EXCEPTION 'Missing table public.bookings. Run base migrations before phase25_marketplace_checkout_core.sql.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  check_in_date date,
  duration_months integer NOT NULL DEFAULT 1 CHECK (duration_months > 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_cart_items_unique_student_room UNIQUE (student_id, room_type_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_cart_items_student_id ON public.booking_cart_items(student_id);
CREATE INDEX IF NOT EXISTS idx_booking_cart_items_hostel_id ON public.booking_cart_items(hostel_id);

CREATE TABLE IF NOT EXISTS public.booking_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'hold_created', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  checkout_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_intents_student_id ON public.booking_intents(student_id);
CREATE INDEX IF NOT EXISTS idx_booking_intents_status_expires_at ON public.booking_intents(status, expires_at);

CREATE TABLE IF NOT EXISTS public.booking_intent_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL REFERENCES public.booking_intents(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity = 1),
  unit_price numeric(10,2) NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'UGX',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_intent_items_unique_room_per_intent UNIQUE (intent_id, room_type_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_intent_items_intent_id ON public.booking_intent_items(intent_id);
CREATE INDEX IF NOT EXISTS idx_booking_intent_items_room_type_id ON public.booking_intent_items(room_type_id);

CREATE TABLE IF NOT EXISTS public.inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL REFERENCES public.booking_intents(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'consumed', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_holds_intent_id ON public.inventory_holds(intent_id);
CREATE INDEX IF NOT EXISTS idx_inventory_holds_room_type_status ON public.inventory_holds(room_type_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_holds_status_expires_at ON public.inventory_holds(status, expires_at);

ALTER TABLE public.booking_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_intent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own cart items" ON public.booking_cart_items;
CREATE POLICY "Students manage own cart items"
ON public.booking_cart_items
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all cart items" ON public.booking_cart_items;
CREATE POLICY "Super admins view all cart items"
ON public.booking_cart_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'super_admin' AND u.is_active = true
));

DROP POLICY IF EXISTS "Students manage own booking intents" ON public.booking_intents;
CREATE POLICY "Students manage own booking intents"
ON public.booking_intents
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all booking intents" ON public.booking_intents;
CREATE POLICY "Super admins view all booking intents"
ON public.booking_intents
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'super_admin' AND u.is_active = true
));

DROP POLICY IF EXISTS "Students view own booking intent items" ON public.booking_intent_items;
CREATE POLICY "Students view own booking intent items"
ON public.booking_intent_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.booking_intents bi
  WHERE bi.id = intent_id AND bi.student_id = auth.uid()
));

DROP POLICY IF EXISTS "System manages booking intent items" ON public.booking_intent_items;
CREATE POLICY "System manages booking intent items"
ON public.booking_intent_items
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.booking_intents bi
  WHERE bi.id = intent_id AND bi.student_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.booking_intents bi
  WHERE bi.id = intent_id AND bi.student_id = auth.uid()
));

DROP POLICY IF EXISTS "Students view own inventory holds" ON public.inventory_holds;
CREATE POLICY "Students view own inventory holds"
ON public.inventory_holds
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "System manages own inventory holds" ON public.inventory_holds;
CREATE POLICY "System manages own inventory holds"
ON public.inventory_holds
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_checkout_intent_from_cart(
  p_student_id uuid DEFAULT auth.uid(),
  p_expires_minutes integer DEFAULT 15
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_intent_id uuid;
  v_expires_at timestamptz;
  v_room record;
  v_updated_room_id uuid;
BEGIN
  v_student_id := COALESCE(p_student_id, auth.uid());

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated student context found.';
  END IF;

  IF p_expires_minutes < 1 OR p_expires_minutes > 120 THEN
    RAISE EXCEPTION 'Expiry minutes must be between 1 and 120.';
  END IF;

  v_expires_at := now() + make_interval(mins => p_expires_minutes);

  INSERT INTO public.booking_intents (student_id, status, expires_at)
  VALUES (v_student_id, 'draft', v_expires_at)
  RETURNING id INTO v_intent_id;

  FOR v_room IN
    SELECT
      ci.hostel_id,
      ci.room_type_id,
      rt.price,
      rt.available
    FROM public.booking_cart_items ci
    JOIN public.room_types rt ON rt.id = ci.room_type_id
    JOIN public.hostels h ON h.id = ci.hostel_id
    WHERE ci.student_id = v_student_id
      AND h.status = 'approved'
    FOR UPDATE OF rt
  LOOP
    UPDATE public.room_types
    SET available = available - 1
    WHERE id = v_room.room_type_id
      AND available >= 1
    RETURNING id INTO v_updated_room_id;

    IF v_updated_room_id IS NULL THEN
      RAISE EXCEPTION 'Room type % is no longer available.', v_room.room_type_id;
    END IF;

    INSERT INTO public.booking_intent_items (intent_id, hostel_id, room_type_id, quantity, unit_price)
    VALUES (v_intent_id, v_room.hostel_id, v_room.room_type_id, 1, v_room.price);

    INSERT INTO public.inventory_holds (intent_id, room_type_id, student_id, quantity, status, expires_at)
    VALUES (v_intent_id, v_room.room_type_id, v_student_id, 1, 'active', v_expires_at);

    v_updated_room_id := NULL;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM public.booking_intent_items bii WHERE bii.intent_id = v_intent_id
  ) THEN
    RAISE EXCEPTION 'Cart is empty or no approved/available items can be checked out.';
  END IF;

  DELETE FROM public.booking_cart_items WHERE student_id = v_student_id;

  UPDATE public.booking_intents
  SET status = 'hold_created', updated_at = now()
  WHERE id = v_intent_id;

  RETURN v_intent_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_booking_intent(
  p_intent_id uuid,
  p_phone_number text DEFAULT NULL,
  p_course text DEFAULT NULL,
  p_move_in_date date DEFAULT NULL,
  p_duration text DEFAULT NULL,
  p_next_of_kin text DEFAULT NULL,
  p_sponsor text DEFAULT NULL,
  p_origin text DEFAULT NULL,
  p_medical_history text DEFAULT NULL,
  p_special_requests text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent public.booking_intents%ROWTYPE;
  v_item record;
  v_bookings_created integer := 0;
BEGIN
  SELECT * INTO v_intent
  FROM public.booking_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking intent not found.';
  END IF;

  IF v_intent.student_id <> auth.uid() THEN
    RAISE EXCEPTION 'You are not allowed to finalize this booking intent.';
  END IF;

  IF v_intent.status <> 'hold_created' THEN
    RAISE EXCEPTION 'Booking intent is not ready for finalization. Current status: %', v_intent.status;
  END IF;

  IF v_intent.expires_at < now() THEN
    RAISE EXCEPTION 'Booking intent has expired.';
  END IF;

  FOR v_item IN
    SELECT bii.*
    FROM public.booking_intent_items bii
    WHERE bii.intent_id = v_intent.id
  LOOP
    INSERT INTO public.bookings (
      student_id,
      hostel_id,
      room_type_id,
      phone_number,
      course,
      move_in_date,
      duration,
      next_of_kin,
      sponsor,
      origin,
      medical_history,
      special_requests,
      status
    ) VALUES (
      v_intent.student_id,
      v_item.hostel_id,
      v_item.room_type_id,
      p_phone_number,
      p_course,
      p_move_in_date,
      p_duration,
      p_next_of_kin,
      p_sponsor,
      p_origin,
      p_medical_history,
      p_special_requests,
      'pending'
    );

    v_bookings_created := v_bookings_created + 1;
  END LOOP;

  UPDATE public.inventory_holds
  SET status = 'consumed', updated_at = now()
  WHERE intent_id = v_intent.id
    AND status = 'active';

  UPDATE public.booking_intents
  SET status = 'completed', updated_at = now()
  WHERE id = v_intent.id;

  RETURN v_bookings_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_inventory_holds()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold record;
  v_released integer := 0;
BEGIN
  FOR v_hold IN
    SELECT *
    FROM public.inventory_holds
    WHERE status = 'active'
      AND expires_at < now()
    FOR UPDATE
  LOOP
    UPDATE public.room_types
    SET available = available + v_hold.quantity
    WHERE id = v_hold.room_type_id;

    UPDATE public.inventory_holds
    SET status = 'expired', updated_at = now()
    WHERE id = v_hold.id;

    v_released := v_released + 1;
  END LOOP;

  UPDATE public.booking_intents
  SET status = 'expired', updated_at = now()
  WHERE status = 'hold_created'
    AND expires_at < now();

  RETURN v_released;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_checkout_intent_from_cart(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_booking_intent(uuid, text, text, date, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_inventory_holds() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_update_booking_cart_items_updated_at ON public.booking_cart_items;
    CREATE TRIGGER trg_update_booking_cart_items_updated_at
      BEFORE UPDATE ON public.booking_cart_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_update_booking_intents_updated_at ON public.booking_intents;
    CREATE TRIGGER trg_update_booking_intents_updated_at
      BEFORE UPDATE ON public.booking_intents
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_update_inventory_holds_updated_at ON public.inventory_holds;
    CREATE TRIGGER trg_update_inventory_holds_updated_at
      BEFORE UPDATE ON public.inventory_holds
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;