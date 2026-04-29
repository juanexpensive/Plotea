import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SavedMediaStatus } from '../../../domain/entities/media';
import { useProfileViewModel } from './ProfileViewModel';

export default function ProfileScreen() {
  const { user, mediaStatuses, watchLogCount, loading, loggingOut, error, handleLogout } = useProfileViewModel();

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{user.display_name ?? user.username}</Text>
      <Text style={styles.meta}>@{user.username}</Text>
      <Text style={styles.meta}>{user.email}</Text>
      <View style={styles.library}>
        <Pressable
          style={({ pressed }) => [styles.statusSection, pressed ? styles.statusSectionPressed : null]}
          onPress={() => router.push('/watchlog-list')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Diario</Text>
            <Text style={styles.sectionCount}>{watchLogCount}</Text>
          </View>
          <Text style={styles.emptyText}>
            {watchLogCount === 0 ? 'Todavia no has registrado visionados.' : 'Ver historial de visionados.'}
          </Text>
        </Pressable>
        <MediaStatusSection
          title="Vistas"
          items={mediaStatuses.watched}
          onPress={() => router.push({ pathname: '/media-status-list', params: { status: 'watched' } })}
        />
        <MediaStatusSection
          title="Quiero verlas"
          items={mediaStatuses.watchlist}
          onPress={() => router.push({ pathname: '/media-status-list', params: { status: 'watchlist' } })}
        />
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed ? styles.logoutButtonPressed : null,
          loggingOut ? styles.logoutButtonDisabled : null,
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutButtonText}>
          {loggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </ScrollView>
  );
}

function MediaStatusSection({
  title,
  items,
  onPress,
}: {
  title: string;
  items: SavedMediaStatus[];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.statusSection, pressed ? styles.statusSectionPressed : null]}
      onPress={onPress}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nada guardado todavia.</Text>
      ) : (
        items.map((item) => (
          <View key={`${item.media_type}-${item.tmdb_id}`} style={styles.statusItem}>
            <Text style={styles.statusItemText}>
              {item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #{item.tmdb_id}
            </Text>
          </View>
        ))
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  screenContent: {
    alignItems: 'center',
    paddingTop: 64,
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
  library: {
    width: '100%',
    marginTop: 28,
    gap: 14,
  },
  statusSection: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#181818',
  },
  statusSectionPressed: {
    opacity: 0.82,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#aaa',
    fontSize: 13,
  },
  emptyText: {
    color: '#777',
    fontSize: 13,
  },
  statusItem: {
    borderTopWidth: 1,
    borderTopColor: '#2b2b2b',
    paddingVertical: 10,
  },
  statusItemText: {
    color: '#ddd',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 28,
    width: '100%',
    maxWidth: 280,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  inlineError: {
    color: '#fca5a5',
    fontSize: 14,
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
});
