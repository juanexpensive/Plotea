import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PublicUserSummary } from '../../../domain/entities/social';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useUserSearchViewModel } from './UserSearchViewModel';

export default function UserSearchScreen() {
  const { query, results, loading, error, isSearching, setQuery, openProfile } = useUserSearchViewModel();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Buscar usuarios</Text>
      <Text style={styles.subtitle}>Encuentra perfiles por nombre de usuario y abre su actividad publica.</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Busca por username"
        placeholderTextColor={darkDesign.colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={darkDesign.colors.accent}
      />

      {!isSearching ? <Text style={styles.helper}>Escribe al menos 2 caracteres.</Text> : null}
      {loading ? (
        <View style={styles.centeredInline}>
          <PlotStarLoader size="small" />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isSearching && !loading && !error && results.length === 0 ? (
        <Text style={styles.helper}>No hemos encontrado usuarios.</Text>
      ) : null}

      <View style={styles.list}>
        {results.map((user) => (
          <UserRow key={user.id} user={user} onPress={() => openProfile(user.username)} />
        ))}
      </View>
    </ScrollView>
  );
}

function UserRow({ user, onPress }: { user: PublicUserSummary; onPress: () => void }) {
  const label = user.display_name ?? user.username;

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowMeta}>@{user.username}</Text>
      </View>
      {user.is_following ? <Text style={styles.followingBadge}>Siguiendo</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  title: sharedStyles.title,
  subtitle: sharedStyles.captionMuted,
  searchInput: sharedStyles.input,
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
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
});
