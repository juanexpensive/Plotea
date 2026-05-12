import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ListSummary } from '../../../domain/entities/lists';
import { SavedMediaStatus } from '../../../domain/entities/media';
import { useProfileViewModel } from './ProfileViewModel';
import { UserStatsSection } from '../social/UserStatsSection';

export default function ProfileScreen() {
  const {
    user,
    lists,
    mediaStatuses,
    stats,
    watchLogCount,
    loading,
    loggingOut,
    savingProfile,
    statsLoading,
    error,
    statsError,
    successMessage,
    isEditing,
    displayNameDraft,
    bioDraft,
    avatarUrlDraft,
    setDisplayNameDraft,
    setBioDraft,
    setAvatarUrlDraft,
    handleLogout,
    startEditing,
    cancelEditing,
    saveProfile,
  } = useProfileViewModel();

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
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <Text style={styles.name}>{user.display_name ?? user.username}</Text>
      <Text style={styles.meta}>@{user.username}</Text>
      <Text style={styles.meta}>{user.email}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed ? styles.statusSectionPressed : null]} onPress={isEditing ? cancelEditing : startEditing}>
        <Text style={styles.secondaryButtonText}>{isEditing ? 'Cancelar edicion' : 'Editar perfil'}</Text>
      </Pressable>
      {isEditing ? (
        <View style={styles.editorCard}>
          <Text style={styles.inputLabel}>Nombre visible</Text>
          <TextInput
            style={styles.input}
            value={displayNameDraft}
            onChangeText={setDisplayNameDraft}
            placeholder="Como quieres mostrarte"
            placeholderTextColor="#777"
          />
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bioDraft}
            onChangeText={setBioDraft}
            placeholder="Cuenta algo sobre ti"
            placeholderTextColor="#777"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.inputLabel}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrlDraft}
            onChangeText={setAvatarUrlDraft}
            placeholder="https://..."
            placeholderTextColor="#777"
            autoCapitalize="none"
          />
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.statusSectionPressed : null,
              savingProfile ? styles.logoutButtonDisabled : null,
            ]}
            onPress={saveProfile}
            disabled={savingProfile}
          >
            <Text style={styles.primaryButtonText}>{savingProfile ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>
        </View>
      ) : null}

      <UserStatsSection
        stats={stats}
        loading={statsLoading}
        error={statsError}
        title="Tu actividad"
      />
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
        <ListSection
          lists={lists}
          onPress={() => router.push('/my-lists')}
          onOpenList={(listId) => router.push({ pathname: '/list-detail', params: { list_id: listId, editable: '1' } })}
        />
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
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </ScrollView>
  );
}

function ListSection({
  lists,
  onPress,
  onOpenList,
}: {
  lists: ListSummary[];
  onPress: () => void;
  onOpenList: (listId: number) => void;
}) {
  return (
    <View style={styles.statusSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis listas</Text>
        <Text style={styles.sectionCount}>{lists.length}</Text>
      </View>
      {lists.length === 0 ? (
        <Text style={styles.emptyText}>Todavia no has creado listas.</Text>
      ) : (
        lists.slice(0, 3).map((list) => (
          <Pressable
            key={list.id}
            style={({ pressed }) => [styles.statusItem, pressed ? styles.statusSectionPressed : null]}
            onPress={() => onOpenList(list.id)}
          >
            <Text style={styles.statusItemText}>{list.name}</Text>
            <Text style={styles.itemMeta}>
              {list.items_count} {list.items_count === 1 ? 'obra' : 'obras'} · {list.is_public ? 'Publica' : 'Privada'}
            </Text>
          </Pressable>
        ))
      )}
      <Pressable style={({ pressed }) => [styles.linkButton, pressed ? styles.statusSectionPressed : null]} onPress={onPress}>
        <Text style={styles.linkText}>Ver todas</Text>
      </Pressable>
    </View>
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: '#333',
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
  bio: {
    color: '#d4d4d4',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#93c5fd',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '700',
  },
  editorCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  inputLabel: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#121212',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 90,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
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
  itemMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  linkText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
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
  successText: {
    color: '#86efac',
    fontSize: 14,
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
});
