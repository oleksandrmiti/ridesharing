import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useEffect, useMemo } from 'react';
import 'react-native-gesture-handler';
import Navigation from './navigation';
import { auth, db } from 'utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onIdTokenChanged } from 'firebase/auth';
import { useAuthStore } from 'store/authStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

  const setUser = useAuthStore((state) => state.setUser);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const setProfileCompleted = useAuthStore((s) => s.setProfileCompleted);
  
  useEffect(() => {
      const unsubscribe = onIdTokenChanged(auth, async (user) => {
        setUser(user);

        // logged out
        if (!user) {
          setProfileCompleted(null);
          setInitializing(false);
          return;
        }

        if (!user.emailVerified) {
          setProfileCompleted(null);
          setInitializing(false);
          return;
        }

        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const completed = snap.exists() ? !!(snap.data() as any).profileCompleted : false;
          setProfileCompleted(completed);
        } catch (e) {
          setProfileCompleted(false);
        } finally {
          setInitializing(false);
        }
      });

      return unsubscribe;
    }, [setUser, setInitializing, setProfileCompleted]);

  return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Navigation theme={theme} />
  </GestureHandlerRootView>
  );
}
