import type { UserRole } from '../types';

/**
 * The single definition of "who may operate the radio station".
 *
 * This mirrors public.is_radio_staff() as it is actually defined in the live
 * database by 20260828_tft_permissions_rls.sql:
 *
 *   select p.role in ('contributor','radio_manager','admin','founder')
 *   from profiles p where p.id = auth.uid()
 *
 * Keep the two in step. If that function changes, change this list in the same
 * commit — a client list that is wider than the database silently renders
 * screens whose every query then fails under RLS, and one that is narrower
 * hides screens from people the database would have allowed.
 *
 * 'staff' and 'presenter' are deliberately NOT here. 20260828 rewrote every
 * such profiles row to 'contributor' and the role check constraint no longer
 * permits them, so listing them would grant nothing and imply they still work.
 *
 * This is a UI guard only. RLS on the database is the security boundary;
 * RequireRole additionally treats profiles.is_admin as a superset.
 */
export const RADIO_STAFF_ROLES: Exclude<UserRole, null>[] = [
  'founder',
  'admin',
  'radio_manager',
  'contributor',
];
