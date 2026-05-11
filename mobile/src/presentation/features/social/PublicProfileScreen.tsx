import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePublicProfileViewModel } from './PublicProfileViewModel';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { profile, loading, savingFollow, error, toggleFollow } = usePublicProfileViewModel(username);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No hemos podido cargar el perfil.'}</Text>
      </View>
    );
  }

  const label = profile.display_name ?? profile.username;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{label}</Text>
      <Text style={styles.meta}>@{profile.username}</Text>
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <View style={styles.stats}>
        <StatCard label="Seguidores" value={profile.followers_count} />
        <StatCard label="Siguiendo" value={profile.following_count} />
        <StatCard label="Resenas" value={profile.reviews_count} />
        <StatCard label="Diario" value={profile.watch_logs_count} />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.followButton,
          profile.is_following ? styles.followButtonActive : null,
          pressed ? styles.followButtonPressed : null,
          savingFollow ? styles.followButtonDisabled : null,
        ]}
        onPress={toggleFollow}
        disabled={savingFollow}
      >
        <Text style={[styles.followButtonText, profile.is_following ? styles.followButtonTextActive : null]}>
          {savingFollow ? 'Actualizando...' : profile.is_following ? 'Siguiendo' : 'Seguir'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    color: '#aaa',
    fontSize: 14,
  },
  bio: {
    color: '#d4d4d4',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 8,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
  },
  followButton: {
    marginTop: 8,
    minHeight: 44,
    minWidth: 180,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#93c5fd',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  followButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  followButtonPressed: {
    opacity: 0.82,
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  followButtonTextActive: {
    color: '#111',
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
    textAlign: 'center',
  },
  inlineError: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
});
