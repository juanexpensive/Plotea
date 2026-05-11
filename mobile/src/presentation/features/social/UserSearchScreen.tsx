import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PublicUserSummary } from '../../../domain/entities/social';
import { useUserSearchViewModel } from './UserSearchViewModel';

export default function UserSearchScreen() {
  const { query, results, loading, error, isSearching, setQuery, openProfile } = useUserSearchViewModel();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buscar usuarios</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Busca por username"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {!isSearching ? <Text style={styles.helper}>Escribe al menos 2 caracteres.</Text> : null}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#fff" />
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
    </View>
  );
}

function UserRow({ user, onPress }: { user: PublicUserSummary; onPress: () => void }) {
  const label = user.display_name ?? user.username;

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={onPress}>
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
  screen: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helper: {
    color: '#888',
    fontSize: 14,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 12,
  },
  rowPressed: {
    opacity: 0.82,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#aaa',
    fontSize: 13,
  },
  followingBadge: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
});
