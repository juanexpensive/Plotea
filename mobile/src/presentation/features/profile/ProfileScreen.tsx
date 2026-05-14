import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MediaItem } from '../../../domain/entities/media';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { UserStatsSection } from '../social/UserStatsSection';
import { useProfileViewModel } from './ProfileViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';

function formatRating(rating: number | null) {
  return rating === null ? 'Sin puntuacion' : `${(rating / 2).toFixed(1)} / 5`;
}

export default function ProfileScreen() {
  const {
    user,
    stats,
    favorites,
    recentWatch,
    loading,
    loggingOut,
    savingProfile,
    savingFavorites,
    statsLoading,
    favoritesLoading,
    recentWatchLoading,
    error,
    statsError,
    favoritesError,
    recentWatchError,
    successMessage,
    isEditing,
    displayNameDraft,
    bioDraft,
    avatarUrlDraft,
    isEditingFavorites,
    favoriteDrafts,
    activeFavoriteSlot,
    favoriteQuery,
    favoriteSearchResults,
    favoriteSearchLoading,
    favoriteSearchError,
    setDisplayNameDraft,
    setBioDraft,
    setAvatarUrlDraft,
    setActiveFavoriteSlot,
    setFavoriteQuery,
    handleLogout,
    startEditing,
    cancelEditing,
    saveProfile,
    startFavoriteEditing,
    cancelFavoriteEditing,
    assignFavorite,
    clearFavoriteSlot,
    saveFavorites,
    openDetail,
    openDiary,
    openLists,
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
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
        <View style={styles.heroActions}>
          <Pressable style={styles.secondaryButton} onPress={isEditing ? cancelEditing : startEditing}>
            <Text style={styles.secondaryButtonText}>{isEditing ? 'Cancelar edicion' : 'Editar perfil'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openDiary}>
            <Text style={styles.secondaryButtonText}>Diario</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openLists}>
            <Text style={styles.secondaryButtonText}>Listas</Text>
          </Pressable>
        </View>
      </View>

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

      <UserStatsSection stats={stats} loading={statsLoading} error={statsError} title="Tu actividad" />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Tus 4 favoritas</Text>
            <Text style={styles.sectionCaption}>Tu identidad visual dentro de PlotSkip.</Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={isEditingFavorites ? cancelFavoriteEditing : startFavoriteEditing}>
            <Text style={styles.secondaryButtonText}>{isEditingFavorites ? 'Cancelar' : 'Editar'}</Text>
          </Pressable>
        </View>
        {favoritesLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
        {favoritesError ? <Text style={styles.errorText}>{favoritesError}</Text> : null}
        <View style={styles.favoritesGrid}>
          {(isEditingFavorites ? favoriteDrafts : Array.from({ length: 4 }, (_, index) => favorites.find((item) => item.position === index)?.media ?? null))
            .map((item, index) => (
              <FavoriteSlot
                key={index}
                media={item}
                active={isEditingFavorites && activeFavoriteSlot === index}
                editable={isEditingFavorites}
                onSelect={() => setActiveFavoriteSlot(index)}
                onClear={() => clearFavoriteSlot(index)}
                onOpen={() => item ? openDetail(item.media_type, item.tmdb_id) : undefined}
              />
            ))}
        </View>
        {isEditingFavorites ? (
          <View style={styles.favoriteEditor}>
            <Text style={styles.favoriteEditorLabel}>Slot activo #{activeFavoriteSlot + 1}</Text>
            <TextInput
              style={styles.input}
              value={favoriteQuery}
              onChangeText={setFavoriteQuery}
              placeholder="Busca pelicula o serie"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              selectionColor={darkDesign.colors.accent}
            />
            {favoriteSearchLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
            {favoriteSearchError ? <Text style={styles.errorText}>{favoriteSearchError}</Text> : null}
            <View style={styles.favoriteSearchList}>
              {favoriteSearchResults.slice(0, 8).map((item) => (
                <Pressable
                  key={`${item.media_type}-${item.tmdb_id}`}
                  style={({ pressed }) => [styles.searchRow, pressed ? styles.pressed : null]}
                  onPress={() => assignFavorite(item)}
                >
                  <Text style={styles.searchRowTitle}>{item.title}</Text>
                  <Text style={styles.searchRowMeta}>
                    {item.media_type === 'movie' ? 'Pelicula' : 'Serie'}
                    {item.release_date ? ` · ${item.release_date.slice(0, 4)}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null, savingFavorites ? styles.disabled : null]}
              onPress={saveFavorites}
              disabled={savingFavorites}
            >
              <Text style={styles.primaryButtonText}>{savingFavorites ? 'Guardando...' : 'Guardar favoritas'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ultimos visionados</Text>
            <Text style={styles.sectionCaption}>Tu rastro mas reciente con nota y caratula.</Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={openDiary}>
            <Text style={styles.secondaryButtonText}>Abrir diario</Text>
          </Pressable>
        </View>
        {recentWatchLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
        {recentWatchError ? <Text style={styles.errorText}>{recentWatchError}</Text> : null}
        {!recentWatchLoading && recentWatch.length === 0 ? (
          <Text style={styles.emptyText}>Todavia no has registrado visionados recientes.</Text>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
          {recentWatch.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.recentCard, pressed ? styles.pressed : null]}
              onPress={() => openDetail(item.media.media_type, item.media.tmdb_id)}
            >
              {item.media.poster_path ? (
                <Image source={{ uri: `${TMDB_IMAGE}${item.media.poster_path}` }} style={styles.recentPoster} />
              ) : (
                <View style={[styles.recentPoster, styles.posterFallback]} />
              )}
              <Text style={styles.recentTitle} numberOfLines={2}>{item.media.title}</Text>
              <Text style={styles.recentMeta}>{item.watched_at}</Text>
              <Text style={styles.recentRating}>{formatRating(item.rating)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null, loggingOut ? styles.disabled : null]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        <Text style={styles.logoutButtonText}>{loggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}</Text>
      </Pressable>

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

function FavoriteSlot({
  media,
  active,
  editable,
  onSelect,
  onClear,
  onOpen,
}: {
  media: MediaItem | null;
  active: boolean;
  editable: boolean;
  onSelect: () => void;
  onClear: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={[styles.favoriteSlot, active ? styles.favoriteSlotActive : null]}>
      <Pressable style={styles.favoriteTapArea} onPress={editable ? onSelect : onOpen} disabled={!editable && media === null}>
        {media?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${media.poster_path}` }} style={styles.favoritePoster} />
        ) : (
          <View style={[styles.favoritePoster, styles.posterFallback, styles.favoritePlaceholder]}>
            <Text style={styles.favoritePlaceholderText}>Vacante</Text>
          </View>
        )}
        <Text style={styles.favoriteTitle} numberOfLines={2}>{media?.title ?? 'Elige una favorita'}</Text>
        <Text style={styles.favoriteMeta}>
          {media ? (media.media_type === 'movie' ? 'Pelicula' : 'Serie') : editable ? 'Toca para seleccionar slot' : 'Slot disponible'}
        </Text>
      </Pressable>
      {editable && media ? (
        <Pressable style={styles.clearSlotButton} onPress={onClear}>
          <Text style={styles.clearSlotText}>Quitar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  centered: sharedStyles.centered,
  heroCard: {
    ...sharedStyles.panel,
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: darkDesign.colors.canvasRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 34,
    fontWeight: '700',
  },
  name: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  meta: sharedStyles.captionMuted,
  bio: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    textAlign: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.sm,
    justifyContent: 'center',
  },
  section: {
    gap: darkDesign.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  sectionCaption: sharedStyles.captionMuted,
  secondaryButton: sharedStyles.secondaryButton,
  secondaryButtonText: sharedStyles.secondaryButtonText,
  editorCard: sharedStyles.panel,
  inputLabel: sharedStyles.label,
  input: sharedStyles.input,
  textArea: {
    ...sharedStyles.textArea,
    minHeight: 90,
  },
  primaryButton: sharedStyles.primaryButton,
  primaryButtonText: sharedStyles.primaryButtonText,
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.md,
  },
  favoriteSlot: {
    width: '47%',
    ...sharedStyles.panel,
    padding: darkDesign.spacing.md,
  },
  favoriteSlotActive: {
    borderColor: darkDesign.colors.accent,
  },
  favoriteTapArea: {
    gap: darkDesign.spacing.sm,
  },
  favoritePoster: {
    width: '100%',
    height: 180,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  favoritePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritePlaceholderText: sharedStyles.captionMuted,
  favoriteTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  favoriteMeta: sharedStyles.captionMuted,
  clearSlotButton: {
    alignSelf: 'flex-start',
    marginTop: darkDesign.spacing.xs,
  },
  clearSlotText: sharedStyles.linkText,
  favoriteEditor: {
    ...sharedStyles.panel,
    padding: darkDesign.spacing.md,
  },
  favoriteEditorLabel: sharedStyles.label,
  favoriteSearchList: {
    gap: darkDesign.spacing.sm,
  },
  searchRow: {
    ...sharedStyles.panel,
    padding: darkDesign.spacing.md,
  },
  searchRowTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  searchRowMeta: sharedStyles.captionMuted,
  recentRow: {
    gap: darkDesign.spacing.md,
    paddingRight: darkDesign.spacing.xl,
  },
  recentCard: {
    width: 140,
    ...sharedStyles.panel,
    padding: darkDesign.spacing.md,
  },
  recentPoster: {
    width: '100%',
    height: 190,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  recentTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  recentMeta: sharedStyles.captionMuted,
  recentRating: {
    color: darkDesign.colors.warning,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  logoutButton: sharedStyles.dangerButton,
  logoutButtonText: sharedStyles.dangerButtonText,
  successText: sharedStyles.successText,
  errorText: sharedStyles.errorText,
  emptyText: sharedStyles.captionMuted,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
