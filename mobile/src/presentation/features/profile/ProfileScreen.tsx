import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useProfileViewModel } from './ProfileViewModel';

export default function ProfileScreen() {
  const { user, loading, error } = useProfileViewModel();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  const initial = (user.display_name || user.username).charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{user.display_name ?? user.username}</Text>
      <Text style={styles.meta}>@{user.username}</Text>
      <Text style={styles.meta}>{user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    paddingTop: 80,
    padding: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  meta: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
});
