import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const GUEST_KEY = 'sqldojo_guest';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = auth loading, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u ?? null));
  }, []);

  const login = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Clear guest mode when logging in
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    return result;
  };

  const logout = () => signOut(auth);

  const enterGuestMode = () => {
    localStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
  };

  const exitGuestMode = () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, login, logout, enterGuestMode, exitGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
