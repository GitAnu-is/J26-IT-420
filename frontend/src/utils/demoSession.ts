import { getDemoToken } from './mockApi';
import { isTokenExpired } from './jwt';
import { tokenStorage } from './tokenStorage';

// Used by Screens previews so signed-in pages render without typing credentials.
export function seedDemoSession() {
  const token = tokenStorage.get();
  if (!token || isTokenExpired(token)) tokenStorage.set(getDemoToken());
}