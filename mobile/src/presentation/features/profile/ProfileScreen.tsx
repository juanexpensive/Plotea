import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ListSummary } from '../../../domain/entities/lists';
import { SavedMediaStatus } from '../../../domain/entities/media';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { UserStatsSection } from '../social/UserStatsSection';
import { useProfileViewModel } from './ProfileViewModel';

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
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
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
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        onPress={isEditing ? cancelEditing : startEditing}
      >
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
            placeholderTextColor={darkDesign.colors.textFaint}
            selectionColor={darkDesign.colors.accent}
          />
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bioDraft}
            onChangeText={setBioDraft}
            placeholder="Cuenta algo sobre ti"
            placeholderTextColor={darkDesign.colors.textFaint}
            multiline
            textAlignVertical="top"
            selectionColor={darkDesign.colors.accent}
          />
          <Text style={styles.inputLabel}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrlDraft}
            onChangeText={setAvatarUrlDraft}
            placeholder="https://..."
            placeholderTextColor={darkDesign.colors.textFaint}
            autoCapitalize="none"
            selectionColor={darkDesign.colors.accent}
          />
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.pressed : null,
              savingProfile ? styles.disabled : null,
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
          style={({ pressed }) => [styles.statusSection, pressed ? styles.pressed : null]}
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
          pressed ? styles.pressed : null,
          loggingOut ? styles.disabled : null,
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutButtonText}>{loggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}</Text>
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
            style={({ pressed }) => [styles.statusItem, pressed ? styles.pressed : null]}
            onPress={() => onOpenList(list.id)}
          >
            <Text style={styles.statusItemText}>{list.name}</Text>
            <Text style={styles.itemMeta}>
              {`${list.items_count} ${list.items_count === 1 ? 'obra' : 'obras'} - ${list.is_public ? 'Publica' : 'Privada'}`}
            </Text>
          </Pressable>
        ))
      )}
      <Pressable style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]} onPress={onPress}>
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
    <Pressable style={({ pressed }) => [styles.statusSection, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nada guardado todavia.</Text>
      ) : (
        items.map((item) => (
          <View key={`${item.media_type}-${item.tmdb_id}`} style={styles.statusItem}>
            <Text style={styles.statusItemText}>{`${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`}</Text>
          </View>
        ))
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  screenContent: {
    ...sharedStyles.scrollContent,
    alignItems: 'center',
  },
  centered: sharedStyles.centered,
  title: {
    ...sharedStyles.title,
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkDesign.colors.canvasRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: darkDesign.colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  meta: sharedStyles.captionMuted,
  bio: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  secondaryButton: sharedStyles.secondaryButton,
  secondaryButtonText: sharedStyles.secondaryButtonText,
  editorCard: {
    ...sharedStyles.panel,
    width: '100%',
    marginTop: darkDesign.spacing.sm,
  },
  inputLabel: sharedStyles.label,
  input: sharedStyles.input,
  textArea: {
    ...sharedStyles.textArea,
    minHeight: 90,
  },
  primaryButton: {
    ...sharedStyles.primaryButton,
    marginTop: 4,
  },
  primaryButtonText: sharedStyles.primaryButtonText,
  library: {
    width: '100%',
    marginTop: darkDesign.spacing.md,
    gap: darkDesign.spacing.md,
  },
  statusSection: {
    ...sharedStyles.panel,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  sectionCount: sharedStyles.captionMuted,
  emptyText: sharedStyles.captionMuted,
  statusItem: {
    borderTopWidth: 1,
    borderTopColor: darkDesign.colors.border,
    paddingVertical: 10,
  },
  statusItemText: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
  },
  itemMeta: sharedStyles.captionMuted,
  linkText: sharedStyles.linkText,
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  logoutButton: {
    ...sharedStyles.dangerButton,
    width: '100%',
    maxWidth: 280,
    marginTop: darkDesign.spacing.md,
  },
  logoutButtonText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.button,
  },
  inlineError: {
    ...sharedStyles.errorText,
    marginTop: 14,
    textAlign: 'center',
  },
  successText: {
    ...sharedStyles.successText,
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: sharedStyles.errorText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
