import { getCurrentUser } from './auth';

/** Returns the current authenticated user with their granted roles. */
export async function getOperationalUser() {
  return getCurrentUser();
}
