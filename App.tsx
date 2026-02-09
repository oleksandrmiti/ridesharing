import './global.css';

import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useEffect, useMemo } from 'react';
import 'react-native-gesture-handler';
import Navigation from './navigation';
import { auth } from 'utils/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { useAuthStore } from 'store/authStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => (colorScheme === 'dark' ? DarkTheme : DefaultTheme), [colorScheme]);

  const setUser = useAuthStore((state) => state.setUser);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, [setUser, setInitializing]);

  return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Navigation theme={theme} />
  </GestureHandlerRootView>
  );
}
