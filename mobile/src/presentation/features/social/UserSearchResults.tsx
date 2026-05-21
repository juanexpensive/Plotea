import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PublicUserSummary } from '../../../domain/entities/social';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

type UserSearchResultsProps = {
  results: PublicUserSummary[];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  onOpenProfile: (username: string) => void;
};

export function UserSearchResults({
  results,
  loading,
  error,
  isSearching,
  onOpenProfile,
}: UserSearchResultsProps) {
  if (loading) {
    return (
      <View style={styles.centeredInline}>
        <PlotStarLoader size="small" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!isSearching) {
    return null;
  }

  if (results.length === 0) {
    return <Text style={styles.helper}>No hemos encontrado usuarios.</Text>;
  }

  return (
    <View style={styles.list}>
      {results.map((user) => (
        <UserRow key={user.id} user={user} onPress={() => onOpenProfile(user.username)} />
      ))}
    </View>
  );
}

function UserRow({ user, onPress }: { user: PublicUserSummary; onPress: () => void }) {
  const label = user.display_name ?? user.username;

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]} onPress={onPress}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowMeta}>@{user.username}</Text>
      </View>
      {user.is_following ? <Text style={styles.followingBadge}>Siguiendo</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  helper: sharedStyles.captionMuted,
  centeredInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: darkDesign.spacing.lg,
  },
  errorText: sharedStyles.errorText,
  list: {
    gap: darkDesign.spacing.md,
    paddingBottom: darkDesign.spacing.lg,
  },
  row: {
    ...sharedStyles.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  pressed: sharedStyles.pressed,
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: darkDesign.colors.canvasRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: sharedStyles.captionMuted,
  followingBadge: {
    color: darkDesign.colors.accent,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
});
