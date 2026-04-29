-- Phase 26: Admin Notifications Trigger
-- Notifies super admins when a new property is submitted for verification.

CREATE OR REPLACE FUNCTION public.notify_super_admin_on_pending_hostel()
RETURNS TRIGGER AS $$
DECLARE
  super_admin_record RECORD;
BEGIN
  -- We only want to notify if a new hostel is explicitly inserted as pending
  IF NEW.status = 'pending' THEN
    -- Find all active super admins
    FOR super_admin_record IN 
      SELECT id FROM public.users WHERE role = 'super_admin' AND is_active = true
    LOOP
      -- Insert a notification for each super admin
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link,
        is_read
      ) VALUES (
        super_admin_record.id,
        'New Property Verification',
        'A new property "' || NEW.name || '" has been submitted by an owner and is pending verification.',
        'system',
        '/admin/hostels',
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the hostels table
DROP TRIGGER IF EXISTS trigger_notify_super_admin_on_pending_hostel ON public.hostels;
CREATE TRIGGER trigger_notify_super_admin_on_pending_hostel
  AFTER INSERT ON public.hostels
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_super_admin_on_pending_hostel();
