import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListSummary } from '../../../domain/entities/lists';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { usePublicProfileViewModel } from './PublicProfileViewModel';
import { UserStatsSection } from './UserStatsSection';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { profile, lists, stats, loading, savingFollow, statsLoading, error, statsError, toggleFollow } =
    usePublicProfileViewModel(username);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
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
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
        </View>
      )}
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
          profile.is_following ? styles.followButtonActive : styles.followButton,
          pressed ? styles.pressed : null,
          savingFollow ? styles.disabled : null,
        ]}
        onPress={toggleFollow}
        disabled={savingFollow}
      >
        <Text style={profile.is_following ? styles.followButtonTextActive : styles.followButtonText}>
          {savingFollow ? 'Actualizando...' : profile.is_following ? 'Siguiendo' : 'Seguir'}
        </Text>
      </Pressable>

      <UserStatsSection stats={stats} loading={statsLoading} error={statsError} />

      <View style={styles.listsSection}>
        <Text style={styles.sectionTitle}>Listas publicas</Text>
        {lists.length === 0 ? <Text style={styles.emptyText}>Todavia no hay listas publicas.</Text> : null}
        {lists.map((list) => (
          <PublicListCard
            key={list.id}
            list={list}
            onPress={() => router.push({ pathname: '/list-detail', params: { list_id: list.id } })}
          />
        ))}
      </View>

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

function PublicListCard({ list, onPress }: { list: ListSummary; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.listCard, pressed ? styles.pressed : null]} onPress={onPress}>
      <Text style={styles.listCardTitle}>{list.name}</Text>
      {list.description ? <Text style={styles.listCardBody}>{list.description}</Text> : null}
      <Text style={styles.listCardMeta}>
        {list.items_count} {list.items_count === 1 ? 'obra' : 'obras'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: {
    ...sharedStyles.scrollContent,
    alignItems: 'center',
  },
  centered: sharedStyles.centered,
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: darkDesign.colors.canvasRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginTop: 8,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    color: darkDesign.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  meta: sharedStyles.captionMuted,
  bio: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.md,
    justifyContent: 'center',
  },
  statCard: {
    width: '47%',
    ...sharedStyles.panel,
    paddingVertical: darkDesign.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: darkDesign.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
  },
  followButton: sharedStyles.secondaryButton,
  followButtonActive: sharedStyles.primaryButton,
  followButtonText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.button,
  },
  followButtonTextActive: sharedStyles.primaryButtonText,
  errorText: sharedStyles.errorText,
  inlineError: sharedStyles.errorText,
  listsSection: {
    width: '100%',
    gap: darkDesign.spacing.md,
    marginTop: darkDesign.spacing.sm,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    alignSelf: 'flex-start',
  },
  emptyText: sharedStyles.captionMuted,
  listCard: sharedStyles.panel,
  listCardTitle: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  listCardBody: sharedStyles.body,
  listCardMeta: sharedStyles.captionMuted,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
