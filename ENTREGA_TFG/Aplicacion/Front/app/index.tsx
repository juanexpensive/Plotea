import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { hasValidSession } from '../src/data/repositories/AuthRepository';
import { darkDesign } from '../src/presentation/theme/darkDesign';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    hasValidSession()
      .then((hasSession) => {
        setIsAuthenticated(hasSession);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: darkDesign.colors.canvas }} />;
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/login'} />;
}
