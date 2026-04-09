-- Phase 23: Deprecated
-- This migration was previously used to bulk-publish pending hostels.
-- Approval is now super-admin-only. Do not auto-approve pending listings.

select
	count(*) as pending_hostels_for_admin_review
from public.hostels
where status = 'pending';
