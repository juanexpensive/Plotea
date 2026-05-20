import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { hasValidSession } from '../../src/data/repositories/AuthRepository';
import { useNotificationsRuntime } from '../../src/presentation/features/notifications/NotificationsRuntime';
import { RandomWatchlistPickModal } from '../../src/presentation/features/profile/RandomWatchlistPickModal';
import { PlotStarLoader } from '../../src/presentation/shared/PlotStarLoader';
import { darkDesign } from '../../src/presentation/theme/darkDesign';

export default function TabsLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRandomPickVisible, setIsRandomPickVisible] = useState(false);
  const syncStartedRef = useRef(false);
  const { syncPushTokenWithBackend } = useNotificationsRuntime();

  useEffect(() => {
    hasValidSession()
      .then((hasSession) => {
        setIsAuthenticated(hasSession);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!ready || !isAuthenticated || syncStartedRef.current) {
      return;
    }

    syncStartedRef.current = true;
    void syncPushTokenWithBackend({ requestPermissions: true });
  }, [isAuthenticated, ready, syncPushTokenWithBackend]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: darkDesign.colors.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <PlotStarLoader size="large" label="Preparando PlotSkip..." />
      </View>
    );
  }

  if (!isAuthenticated) {
    syncStartedRef.current = false;
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: darkDesign.colors.canvasRaised,
            borderTopColor: darkDesign.colors.border,
            height: 72,
          },
          tabBarActiveTintColor: darkDesign.colors.accent,
          tabBarInactiveTintColor: darkDesign.colors.textFaint,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 6,
          },
          tabBarIconStyle: {
            marginTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wip"
          options={{
            title: 'Random',
            tabBarButton: () => (
              <View style={styles.wipButton}>
                <Pressable style={styles.wipInner} onPress={() => setIsRandomPickVisible(true)}>
                  <Ionicons name="star" size={22} color={darkDesign.colors.accent} />
                  <Text style={styles.wipLabel}>Random</Text>
                </Pressable>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            title: 'Listas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <RandomWatchlistPickModal
        visible={isRandomPickVisible}
        onClose={() => setIsRandomPickVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  wipInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  wipLabel: {
    color: darkDesign.colors.accentSoft,
    fontSize: 11,
    fontWeight: '600',
  },
});
