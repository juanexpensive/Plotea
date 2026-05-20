import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  NativeSyntheticEvent,
  TextLayoutEventData,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { ListItem, ListOwner } from '../../../domain/entities/lists';
import { MediaItem } from '../../../domain/entities/media';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useListDetailViewModel } from './ListDetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ListDetailScreen() {
  const { list_id } = useLocalSearchParams<{ list_id?: string }>();
  const listId = list_id ? Number(list_id) : null;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasLongDescription, setHasLongDescription] = useState(false);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    detail,
    form,
    loading,
    saving,
    deleting,
    error,
    query,
    searchResults,
    searchLoading,
    searchError,
    inviteQuery,
    inviteResults,
    inviteLoading,
    inviteError,
    canEdit,
    canDelete,
    canLeave,
    canManageCollaborators,
    setQuery,
    setInviteQuery,
    updateForm,
    saveMetadata,
    handleDeleteList,
    handleLeaveList,
    handleAddItem,
    handleRemoveItem,
    swapItems,
    inviteCollaborator,
    openOwnerProfile,
    openCollaboratorProfile,
  } = useListDetailViewModel(listId);

  const participants = detail ? [detail.owner, ...detail.collaborators] : [];
  const canShowDescriptionToggle = Boolean(detail?.description) && hasLongDescription;

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!detail || !isEditingHero) {
      return;
    }

    const normalizedName = form.name.trim();
    const normalizedDescription = form.description?.trim() || null;
    const hasChanged =
      normalizedName !== detail.name ||
      normalizedDescription !== detail.description ||
      form.is_public !== detail.is_public;

    if (!hasChanged || saving) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      void saveMetadata();
    }, 500);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [detail, form, isEditingHero, saveMetadata, saving]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <PlotStarLoader size="large" label="Cargando lista..." />
      </View>
    );
  }

  if (error && !detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  async function onItemPress(item: ListItem) {
    if (!canEdit) {
      router.push({ pathname: '/detail', params: { tmdb_id: item.tmdb_id, media_type: item.media_type } });
      return;
    }

    const key = toItemKey(item);
    if (selectedKey === null) {
      setSelectedKey(key);
      return;
    }

    if (selectedKey === key) {
      setSelectedKey(null);
      return;
    }

    const source = detail?.items.find((entry) => toItemKey(entry) === selectedKey);
    if (!source) {
      setSelectedKey(null);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const swapped = await swapItems(source, item);
    setSelectedKey(swapped ? null : key);
  }

  async function onAddItem(item: MediaItem) {
    await handleAddItem(item);
    setIsAddModalVisible(false);
  }

  async function onInviteUser(user: ListOwner) {
    await inviteCollaborator(user);
    setIsInviteModalVisible(false);
  }

  function openActionMenu() {
    if (isEditingHero) {
      return;
    }
    setIsActionMenuVisible(true);
  }

  function closeActionMenu() {
    setIsActionMenuVisible(false);
  }

  function confirmDeleteList() {
    closeActionMenu();
    Alert.alert('Eliminar lista', 'Esta lista se borrara para siempre.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void handleDeleteList();
        },
      },
    ]);
  }

  function confirmLeaveList() {
    closeActionMenu();
    Alert.alert(
      'Salir de la lista',
      'La lista dejara de aparecerte. Si otras personas siguen dentro, continuara para ellas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            void handleLeaveList();
          },
        },
      ],
    );
  }

  function openInviteModal() {
    closeActionMenu();
    setIsInviteModalVisible(true);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {detail ? (
          <>
            <InviteModal
              visible={isInviteModalVisible}
              query={inviteQuery}
              results={inviteResults}
              loading={inviteLoading}
              error={inviteError}
              saving={saving}
              onChangeQuery={setInviteQuery}
              onClose={() => setIsInviteModalVisible(false)}
              onClear={() => setInviteQuery('')}
              onInvite={onInviteUser}
            />

            <AddMediaModal
              visible={isAddModalVisible}
              query={query}
              results={searchResults}
              loading={searchLoading}
              error={searchError}
              saving={saving}
              onChangeQuery={setQuery}
              onClose={() => setIsAddModalVisible(false)}
              onClear={() => setQuery('')}
              onAdd={onAddItem}
            />

            <ListActionsMenu
              visible={isActionMenuVisible}
              canInvite={canManageCollaborators}
              canDelete={canDelete}
              canLeave={canLeave && !canDelete}
              busy={saving || deleting}
              onClose={closeActionMenu}
              onInvite={openInviteModal}
              onDelete={confirmDeleteList}
              onLeave={confirmLeaveList}
            />

            <View style={styles.heroSection}>
              {canEdit && isEditingHero ? (
                <View style={styles.topRow}>
                  <View style={styles.iconSpacer} />
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => {
                      void saveMetadata();
                      setIsEditingHero(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color={darkDesign.colors.text} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.topRow}>
                  <View style={styles.iconSpacer} />
                  <Pressable style={styles.iconButton} onPress={openActionMenu} disabled={saving || deleting}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={darkDesign.colors.text} />
                  </Pressable>
                </View>
              )}
              <Pressable
                disabled={!canEdit || isEditingHero}
                onPress={() => canEdit ? setIsEditingHero(true) : undefined}
                style={({ pressed }) => [styles.titleBlock, canEdit && !isEditingHero && pressed ? styles.pressed : null]}
              >
                {isEditingHero ? (
                  <>
                    <TextInput
                      style={styles.titleInput}
                      value={form.name}
                      onChangeText={(value) => updateForm({ name: value })}
                      placeholder="Nombre"
                      placeholderTextColor={darkDesign.colors.textFaint}
                      selectionColor={darkDesign.colors.accent}
                    />
                    <TextInput
                      style={styles.descriptionInput}
                      value={form.description ?? ''}
                      onChangeText={(value) => updateForm({ description: value })}
                      placeholder="Descripcion"
                      placeholderTextColor={darkDesign.colors.textFaint}
                      multiline
                      selectionColor={darkDesign.colors.accent}
                    />
                    <View style={styles.heroEditFooter}>
                      <View style={styles.toggleRow}>
                        <View style={styles.toggleCopy}>
                          <Text style={styles.toggleLabel}>Lista publica</Text>
                          <Text style={styles.toggleHint}>Haz visible la coleccion al resto de usuarios.</Text>
                        </View>
                        <Switch
                          value={form.is_public}
                          onValueChange={(value) => updateForm({ is_public: value })}
                          trackColor={{ false: darkDesign.colors.borderStrong, true: darkDesign.colors.accentDeep }}
                          thumbColor={form.is_public ? darkDesign.colors.onAccent : darkDesign.colors.text}
                        />
                      </View>
                      {saving ? (
                        <View style={styles.inlineSavingRow}>
                          <PlotStarLoader size="small" />
                          <Text style={styles.inlineSavingText}>Guardando cambios...</Text>
                        </View>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <>
                    {detail.description ? (
                      <Text
                        style={styles.descriptionMeasure}
                        onTextLayout={(event: NativeSyntheticEvent<TextLayoutEventData>) => {
                          setHasLongDescription(event.nativeEvent.lines.length > 3);
                        }}
                      >
                        {detail.description}
                      </Text>
                    ) : null}
                    <Text style={styles.title}>{detail.name}</Text>
                    {detail.description ? (
                      <Text
                        style={styles.description}
                        numberOfLines={isDescriptionExpanded ? undefined : 3}
                      >
                        {detail.description}
                      </Text>
                    ) : null}
                    {canShowDescriptionToggle ? (
                      <Text style={styles.readMoreText} onPress={() => setIsDescriptionExpanded((current) => !current)}>
                        {isDescriptionExpanded ? 'Leer menos' : 'Leer mas'}
                      </Text>
                    ) : null}
                    {canEdit ? <Text style={styles.editHint}>Toca para editar titulo y descripcion</Text> : null}
                  </>
                )}
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {canEdit ? <Text style={styles.helper}>Toca una obra y luego otra para intercambiar su posicion.</Text> : null}
            {participants.length > 1 ? (
              <>
                <View style={styles.membersCard}>
                  <View style={styles.membersHeader}>
                    <View style={styles.memberInfo}>
                      <AvatarStack users={participants} />
                      <View style={styles.memberCopy}>
                        <Text style={styles.ownerText}>Participan</Text>
                        <Text style={styles.memberMeta}>
                          {participants.length} personas - {detail.is_public ? 'Lista publica' : 'Lista privada'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.participantsList}>
                  <ParticipantRow user={detail.owner} roleLabel="Creador" onPress={openOwnerProfile} />
                  {detail.collaborators.map((user) => (
                    <ParticipantRow
                      key={user.id}
                      user={user}
                      roleLabel="Participa"
                      onPress={() => openCollaboratorProfile(user.username)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.posterGrid}>
              {detail.items.map((item, index) => (
                <View key={toItemKey(item)} style={[styles.gridCell, index % 4 === 3 ? styles.gridCellLast : null]}>
                  <PosterTile
                    item={item}
                    selected={selectedKey === toItemKey(item)}
                    editable={canEdit}
                    onPress={() => void onItemPress(item)}
                    onRemove={canEdit ? () => handleRemoveItem(item) : undefined}
                  />
                </View>
              ))}

              {canEdit ? (
                <View style={[styles.gridCell, detail.items.length % 4 === 3 ? styles.gridCellLast : null]}>
                  <Pressable style={({ pressed }) => [styles.addTile, pressed ? styles.pressed : null]} onPress={() => setIsAddModalVisible(true)}>
                    <Ionicons name="add" size={28} color={darkDesign.colors.textMuted} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {canEdit ? (
        <Pressable style={({ pressed }) => [styles.fab, pressed ? styles.pressed : null]} onPress={() => setIsAddModalVisible(true)}>
          <Ionicons name="add" size={28} color={darkDesign.colors.onAccent} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ListActionsMenu({
  visible,
  canInvite,
  canDelete,
  canLeave,
  busy,
  onClose,
  onInvite,
  onDelete,
  onLeave,
}: {
  visible: boolean;
  canInvite: boolean;
  canDelete: boolean;
  canLeave: boolean;
  busy: boolean;
  onClose: () => void;
  onInvite: () => void;
  onDelete: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.actionMenuOverlay}>
        <Pressable style={styles.actionMenuBackdrop} onPress={onClose} />
        <View style={styles.listActionMenuCard}>
          {canInvite ? (
            <Pressable style={styles.actionMenuItem} onPress={onInvite} disabled={busy}>
              <Ionicons name="person-add-outline" size={18} color={darkDesign.colors.text} />
              <Text style={styles.actionMenuText}>Invitar</Text>
            </Pressable>
          ) : null}
          {canLeave ? (
            <Pressable style={styles.actionMenuItem} onPress={onLeave} disabled={busy}>
              <Ionicons name="exit-outline" size={18} color={darkDesign.colors.text} />
              <Text style={styles.actionMenuText}>Salir de la lista</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable style={styles.actionMenuItem} onPress={onDelete} disabled={busy}>
              <Ionicons name="trash-outline" size={18} color="#ffb0b0" />
              <Text style={styles.actionMenuDangerText}>Eliminar lista</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function ParticipantRow({
  user,
  roleLabel,
  onPress,
}: {
  user: ListOwner;
  roleLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.participantRow} onPress={onPress}>
      <MiniAvatar user={user} />
      <View style={styles.participantCopy}>
        <Text style={styles.participantName}>@{user.username}</Text>
        <Text style={styles.participantMeta}>{user.display_name ?? roleLabel}</Text>
      </View>
      <Text style={styles.participantRole}>{roleLabel}</Text>
    </Pressable>
  );
}

function InviteModal({
  visible,
  query,
  results,
  loading,
  error,
  saving,
  onChangeQuery,
  onClose,
  onClear,
  onInvite,
}: {
  visible: boolean;
  query: string;
  results: ListOwner[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onInvite: (user: ListOwner) => void | Promise<void>;
}) {
  const hasQuery = query.trim().length > 0;
  const canSearch = query.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.modalScreen}>
        <StatusBar style="light" />
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalIconButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={darkDesign.colors.text} />
          </Pressable>
          <View style={styles.modalInputShell}>
            <Text style={styles.modalEyebrow}>INVITE</Text>
            <TextInput
              style={styles.modalInput}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar colaborador"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={darkDesign.colors.accent}
              autoFocus
            />
          </View>
          <Pressable style={styles.modalIconButton} onPress={hasQuery ? onClear : onClose}>
            <Ionicons name={hasQuery ? 'close' : 'close-outline'} size={22} color={darkDesign.colors.text} />
          </Pressable>
        </View>

        {!canSearch ? (
          <EmptyModalState
            title="Busca a alguien"
            body="Escribe al menos 2 caracteres para encontrar personas invitables."
          />
        ) : (
          <ScrollView style={styles.modalResults} contentContainerStyle={styles.modalResultsContent}>
            <ResultState loading={loading} error={error} emptyMessage="No hay usuarios disponibles" hasResults={results.length > 0}>
              {results.map((user) => (
                <View key={user.id} style={styles.resultRow}>
                  <MiniAvatar user={user} />
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultTitle}>@{user.username}</Text>
                    <Text style={styles.resultMeta}>{user.display_name ?? 'Follow mutuo'}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.resultAction, pressed ? styles.primaryPressed : null, saving ? styles.disabled : null]}
                    onPress={() => void onInvite(user)}
                    disabled={saving}
                  >
                    <Text style={styles.resultActionText}>Invitar</Text>
                  </Pressable>
                </View>
              ))}
            </ResultState>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function AddMediaModal({
  visible,
  query,
  results,
  loading,
  error,
  saving,
  onChangeQuery,
  onClose,
  onClear,
  onAdd,
}: {
  visible: boolean;
  query: string;
  results: MediaItem[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onAdd: (item: MediaItem) => void | Promise<void>;
}) {
  const hasQuery = query.trim().length > 0;
  const canSearch = query.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.modalScreen}>
        <StatusBar style="light" />
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalIconButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={darkDesign.colors.text} />
          </Pressable>
          <View style={styles.modalInputShell}>
            <Text style={styles.modalEyebrow}>ADD TO LIST</Text>
            <TextInput
              style={styles.modalInput}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar pelicula o serie"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={darkDesign.colors.accent}
              autoFocus
            />
          </View>
          <Pressable style={styles.modalIconButton} onPress={hasQuery ? onClear : onClose}>
            <Ionicons name={hasQuery ? 'close' : 'close-outline'} size={22} color={darkDesign.colors.text} />
          </Pressable>
        </View>

        {!canSearch ? (
          <EmptyModalState
            title="Empieza a escribir"
            body="Usa al menos 2 caracteres para encontrar peliculas o series."
          />
        ) : (
          <ScrollView style={styles.modalResults} contentContainerStyle={styles.modalResultsContent}>
            <ResultState loading={loading} error={error} emptyMessage="No hay resultados" hasResults={results.length > 0}>
              {results.slice(0, 9).map((item) => (
                <Pressable
                  key={`${item.media_type}-${item.tmdb_id}`}
                  style={({ pressed }) => [styles.resultRow, pressed ? styles.pressed : null, saving ? styles.disabled : null]}
                  onPress={() => void onAdd(item)}
                  disabled={saving}
                >
                  {item.poster_path ? (
                    <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.resultPoster} />
                  ) : (
                    <View style={[styles.resultPoster, styles.posterFallback]} />
                  )}
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultMeta}>
                      {item.media_type === 'movie' ? 'Pelicula' : 'Serie'}
                      {item.release_date ? ` · ${item.release_date.slice(0, 4)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.resultLink}>Anadir</Text>
                </Pressable>
              ))}
            </ResultState>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function EmptyModalState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.modalEmptyState}>
      <Text style={styles.modalEmptyTitle}>{title}</Text>
      <Text style={styles.modalEmptyBody}>{body}</Text>
    </View>
  );
}

function ResultState({
  loading,
  error,
  emptyMessage,
  hasResults,
  children,
}: {
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  hasResults: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <View style={styles.modalState}>
        <PlotStarLoader size="small" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.modalState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!hasResults) {
    return (
      <View style={styles.modalState}>
        <Text style={styles.mutedText}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function PosterTile({
  item,
  selected,
  editable,
  onPress,
  onRemove,
}: {
  item: ListItem;
  selected: boolean;
  editable: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: selected ? 1.03 : 1, duration: 140, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: selected ? 1 : 0.92, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, selected]);

  return (
    <Animated.View style={[styles.posterTile, selected ? styles.posterTileSelected : null, { transform: [{ scale }], opacity }]}>
      <Pressable onPress={onPress} style={styles.posterTilePressable}>
        {item.media_summary?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${item.media_summary.poster_path}` }} style={styles.posterImage} />
        ) : (
          <View style={[styles.posterImage, styles.posterFallback]} />
        )}
        {editable && onRemove ? (
          <Pressable style={styles.posterRemoveButton} onPress={onRemove}>
            <Ionicons name="close" size={14} color={darkDesign.colors.text} />
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function AvatarStack({ users }: { users: ListOwner[] }) {
  const visibleUsers = users.slice(0, 3);
  const hiddenCount = users.length - visibleUsers.length;

  return (
    <View style={styles.avatarStack}>
      {visibleUsers.map((user) => (
        <MiniAvatar key={user.id} user={user} stacked />
      ))}
      {hiddenCount > 0 ? (
        <View style={[styles.miniAvatar, styles.avatarCounter]}>
          <Text style={styles.avatarCounterText}>+{hiddenCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MiniAvatar({ user, stacked = false }: { user: ListOwner; stacked?: boolean }) {
  const initial = (user.display_name ?? user.username).charAt(0).toUpperCase();

  return user.avatar_url ? (
    <Image source={{ uri: user.avatar_url }} style={[styles.miniAvatarImage, stacked ? styles.stackedAvatar : null]} />
  ) : (
    <View style={[styles.miniAvatar, stacked ? styles.stackedAvatar : null]}>
      <Text style={styles.miniAvatarText}>{initial}</Text>
    </View>
  );
}

function toItemKey(item: ListItem) {
  return `${item.media_type}-${item.tmdb_id}`;
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: {
    ...sharedStyles.scrollContent,
    paddingTop: 0,
    paddingBottom: 120,
    gap: darkDesign.spacing.xl,
  },
  centered: sharedStyles.centered,
  heroSection: {
    gap: darkDesign.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvasInset,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  title: {
    color: darkDesign.colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  titleBlock: {
    gap: darkDesign.spacing.sm,
  },
  description: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    marginTop: -4,
  },
  descriptionMeasure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
  },
  readMoreText: {
    color: '#ffb787',
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  editHint: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  membersCard: {
    gap: darkDesign.spacing.md,
    padding: darkDesign.spacing.md,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.panel,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    flex: 1,
  },
  memberCopy: {
    flex: 1,
    gap: 3,
  },
  ownerText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  memberMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
  },
  participantsList: {
    gap: darkDesign.spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.xs,
  },
  participantCopy: {
    flex: 1,
    gap: 3,
  },
  participantName: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  participantMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
  },
  participantRole: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inviteButton: {
    minHeight: 38,
    borderRadius: darkDesign.radii.pill,
    backgroundColor: darkDesign.colors.canvasRaised,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    paddingHorizontal: darkDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inviteButtonText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  titleInput: {
    color: darkDesign.colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.9,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  descriptionInput: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  heroEditFooter: {
    gap: darkDesign.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleLabel: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.body,
    fontWeight: '600',
  },
  toggleHint: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
    marginTop: 2,
  },
  inlineSavingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
  },
  inlineSavingText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  primaryPressed: {
    backgroundColor: darkDesign.colors.accentDeep,
  },
  primaryButtonText: sharedStyles.primaryButtonText,
  dangerButton: {
    minHeight: 42,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: '#7a3030',
    backgroundColor: '#2a1515',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.lg,
    flex: 1,
  },
  dangerButtonText: {
    color: '#ffb0b0',
    ...darkDesign.typography.button,
  },
  helper: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    textAlign: 'center',
    marginTop: -8,
  },
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridCell: {
    width: '24%',
    marginRight: '1.333%',
    marginBottom: darkDesign.spacing.md,
  },
  gridCellLast: {
    marginRight: 0,
  },
  posterTile: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.panel,
  },
  posterTileSelected: {
    borderColor: darkDesign.colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  posterTilePressable: {
    flex: 1,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
    borderRadius: 0,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
  },
  posterRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 0,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaboratorsPanel: {
    ...sharedStyles.panel,
    padding: darkDesign.spacing.lg,
    borderRadius: darkDesign.radii.xl,
  },
  panelTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    marginBottom: darkDesign.spacing.sm,
  },
  collaboratorsList: {
    gap: darkDesign.spacing.sm,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
  },
  collaboratorBody: {
    flex: 1,
    gap: 3,
  },
  collaboratorName: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  collaboratorMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
  },
  removeChip: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: '#7a3030',
    backgroundColor: '#2a1515',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.sm,
  },
  removeChipText: {
    color: '#ffb0b0',
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingTop: 72,
    paddingLeft: darkDesign.spacing.xl,
    paddingRight: darkDesign.spacing.xl,
    alignItems: 'flex-end',
  },
  actionMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  listActionMenuCard: {
    width: 220,
    borderRadius: darkDesign.radii.lg,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.panel,
    overflow: 'hidden',
    ...darkDesign.shadows.soft,
  },
  actionMenuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    paddingHorizontal: darkDesign.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  actionMenuText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  actionMenuDangerText: {
    color: '#ffb0b0',
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  modalScreen: {
    flex: 1,
    backgroundColor: '#101418',
    paddingTop: 56,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: darkDesign.spacing.lg,
  },
  modalIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputShell: {
    flex: 1,
    gap: 6,
  },
  modalEyebrow: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  modalInput: {
    color: darkDesign.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    paddingVertical: 0,
  },
  modalResults: {
    flex: 1,
  },
  modalResultsContent: {
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: 32,
  },
  modalEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.xxl,
    gap: darkDesign.spacing.sm,
  },
  modalEmptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  modalEmptyBody: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    textAlign: 'center',
  },
  modalState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  resultPoster: {
    width: 64,
    height: 96,
    borderRadius: darkDesign.radii.md,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  resultCopy: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    color: darkDesign.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  resultMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  resultAction: {
    minHeight: 34,
    borderRadius: darkDesign.radii.pill,
    backgroundColor: darkDesign.colors.canvasRaised,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.md,
  },
  resultActionText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  resultLink: {
    color: '#ffb787',
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkDesign.colors.panelStrong,
    borderWidth: 2,
    borderColor: darkDesign.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: darkDesign.colors.panel,
  },
  stackedAvatar: {
    marginRight: -10,
  },
  miniAvatarText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  avatarCounter: {
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  avatarCounterText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkDesign.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...darkDesign.shadows.card,
  },
  errorText: sharedStyles.errorText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
