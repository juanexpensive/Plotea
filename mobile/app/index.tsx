import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { hasValidSession } from '../src/data/repositories/AuthRepository';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    hasValidSession().then((hasSession) => {
      setIsAuthenticated(hasSession);
      setReady(true);
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#111' }} />;
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/login'} />;
}
