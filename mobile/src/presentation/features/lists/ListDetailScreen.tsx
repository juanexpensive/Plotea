import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { ListItem, ListOwner } from '../../../domain/entities/lists';
import { useListDetailViewModel } from './ListDetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

const design = {
  emerald: '#3ecf8e',
  emeraldDeep: '#24b47e',
  ink: '#171717',
  inkMute: '#707070',
  canvas: '#ffffff',
  canvasSoft: '#fafafa',
  hairline: '#dfdfdf',
  hairlineStrong: '#c7c7c7',
  danger: '#ff2201',
  shadow: 'rgba(0,0,0,0.08)',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ListDetailScreen() {
  const { list_id } = useLocalSearchParams<{ list_id?: string }>();
  const listId = list_id ? Number(list_id) : null;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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
    canManageCollaborators,
    setQuery,
    setInviteQuery,
    updateForm,
    saveMetadata,
    handleDeleteList,
    handleAddItem,
    handleRemoveItem,
    swapItems,
    inviteCollaborator,
    removeCollaborator,
    openOwnerProfile,
    openCollaboratorProfile,
  } = useListDetailViewModel(listId);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={design.emerald} />
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {detail ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>LISTA</Text>
            <Text style={styles.title}>{detail.name}</Text>
            <Pressable onPress={openOwnerProfile}>
              <Text style={styles.ownerMeta}>Creada por @{detail.owner.username}</Text>
            </Pressable>
            {detail.description ? <Text style={styles.description}>{detail.description}</Text> : null}
            <View style={styles.badgesRow}>
              <StatusPill label={detail.relationship === 'owner' ? 'Owner' : detail.relationship === 'collaborator' ? 'Colaborador' : 'Viewer'} tone={detail.relationship === 'viewer' ? 'soft' : 'green'} />
              <StatusPill label={detail.is_public ? 'Publica' : 'Privada'} tone="soft" />
            </View>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.sectionTitle}>Equipo</Text>
            <Pressable onPress={openOwnerProfile}>
              <Text style={styles.metaLine}>Owner: @{detail.owner.username}</Text>
            </Pressable>
            {detail.collaborators.length > 0 ? (
              <View style={styles.collaboratorsList}>
                {detail.collaborators.map((user) => (
                  <View key={user.id} style={styles.collaboratorRow}>
                    <Pressable style={styles.collaboratorBody} onPress={() => openCollaboratorProfile(user.username)}>
                      <Text style={styles.collaboratorName}>@{user.username}</Text>
                      <Text style={styles.collaboratorMeta}>{user.display_name ?? 'Colaborador activo'}</Text>
                    </Pressable>
                    {canManageCollaborators ? (
                      <Pressable style={({ pressed }) => [styles.removeChip, pressed ? styles.pressed : null]} onPress={() => void removeCollaborator(user)}>
                        <Text style={styles.removeChipText}>Quitar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.metaMuted}>Todavia no hay colaboradores activos.</Text>
            )}
          </View>

          {canManageCollaborators ? (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Invitar colaborador</Text>
              <Text style={styles.panelCopy}>Solo apareceran usuarios con follow mutuo y sin invitacion pendiente.</Text>
              <TextInput
                style={styles.input}
                value={inviteQuery}
                onChangeText={setInviteQuery}
                placeholder="Busca por username"
                placeholderTextColor="#9a9a9a"
                selectionColor={design.emerald}
              />
              {inviteLoading ? <ActivityIndicator size="small" color={design.emerald} /> : null}
              {inviteError ? <Text style={styles.errorText}>{inviteError}</Text> : null}
              <View style={styles.resultsList}>
                {inviteResults.map((user) => (
                  <View key={user.id} style={styles.searchRow}>
                    <View style={styles.searchRowBody}>
                      <Text style={styles.searchRowTitle}>@{user.username}</Text>
                      <Text style={styles.searchRowMeta}>{user.display_name ?? 'Follow mutuo'}</Text>
                    </View>
                    <Pressable style={({ pressed }) => [styles.primaryInlineButton, pressed ? styles.primaryPressed : null, saving ? styles.disabled : null]} onPress={() => void inviteCollaborator(user)} disabled={saving}>
                      <Text style={styles.primaryInlineButtonText}>Invitar</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {canEdit ? (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Editar lista</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) => updateForm({ name: value })}
                placeholder="Nombre"
                placeholderTextColor="#9a9a9a"
                selectionColor={design.emerald}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description ?? ''}
                onChangeText={(value) => updateForm({ description: value })}
                placeholder="Descripcion"
                placeholderTextColor="#9a9a9a"
                multiline
                selectionColor={design.emerald}
              />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Lista publica</Text>
                <Switch
                  value={form.is_public}
                  onValueChange={(value) => updateForm({ is_public: value })}
                  trackColor={{ false: '#d4d4d4', true: '#4ade80' }}
                  thumbColor={form.is_public ? design.ink : '#fff'}
                />
              </View>
              <View style={styles.actionsRow}>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryPressed : null, saving ? styles.disabled : null]} onPress={saveMetadata} disabled={saving}>
                  <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
                {canDelete ? (
                  <Pressable style={({ pressed }) => [styles.secondaryDangerButton, pressed ? styles.pressed : null, deleting ? styles.disabled : null]} onPress={handleDeleteList} disabled={deleting}>
                    <Text style={styles.secondaryDangerText}>{deleting ? 'Borrando...' : 'Borrar'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {canEdit ? (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Anadir obra</Text>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Busca una pelicula o serie"
                placeholderTextColor="#9a9a9a"
                selectionColor={design.emerald}
              />
              {searchLoading ? <ActivityIndicator size="small" color={design.emerald} /> : null}
              {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
              <View style={styles.resultsList}>
                {searchResults.slice(0, 6).map((item) => (
                  <Pressable
                    key={`${item.media_type}-${item.tmdb_id}`}
                    style={({ pressed }) => [styles.searchRow, pressed ? styles.pressed : null]}
                    onPress={() => void handleAddItem(item)}
                  >
                    <View style={styles.searchRowBody}>
                      <Text style={styles.searchRowTitle}>{item.title}</Text>
                      <Text style={styles.searchRowMeta}>{`${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`}</Text>
                    </View>
                    <Text style={styles.rowAction}>Anadir</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {canEdit ? <Text style={styles.helper}>Toca una obra y luego otra para intercambiar su posicion.</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.itemsList}>
            {detail.items.map((item) => (
              <AnimatedListCard
                key={toItemKey(item)}
                item={item}
                selected={selectedKey === toItemKey(item)}
                editable={canEdit}
                onPress={() => void onItemPress(item)}
                onRemove={canEdit ? () => handleRemoveItem(item) : undefined}
              />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function AnimatedListCard({
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
  const opacity = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: selected ? 1.015 : 1, duration: 140, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: selected ? 1 : 0.98, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, selected]);

  const title = item.media_summary?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;

  return (
    <Animated.View style={[styles.itemCard, selected ? styles.itemCardSelected : null, { transform: [{ scale }], opacity }]}>
      <Pressable style={styles.itemMain} onPress={onPress}>
        {item.media_summary?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${item.media_summary.poster_path}` }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemMeta}>
            {`Posicion ${item.position + 1} · ${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`}
          </Text>
          <Text style={styles.itemAuthor}>Anadida por @{item.added_by.username}</Text>
        </View>
      </Pressable>
      {editable && onRemove ? (
        <Pressable style={({ pressed }) => [styles.removeChip, pressed ? styles.pressed : null]} onPress={onRemove}>
          <Text style={styles.removeChipText}>Quitar</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'soft' }) {
  return (
    <View style={tone === 'green' ? styles.greenPill : styles.softPill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function toItemKey(item: ListItem) {
  return `${item.media_type}-${item.tmdb_id}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  heroCard: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  eyebrow: {
    color: design.inkMute,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  title: {
    color: design.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  ownerMeta: {
    color: design.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    color: design.inkMute,
    fontSize: 15,
    lineHeight: 22,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaCard: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: design.ink,
    fontSize: 18,
    fontWeight: '500',
  },
  metaLine: {
    color: design.ink,
    fontSize: 14,
  },
  metaMuted: {
    color: design.inkMute,
    fontSize: 14,
  },
  collaboratorsList: {
    gap: 10,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collaboratorBody: {
    flex: 1,
    gap: 3,
  },
  collaboratorName: {
    color: design.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  collaboratorMeta: {
    color: design.inkMute,
    fontSize: 13,
  },
  panel: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 16,
    gap: 12,
  },
  panelCopy: {
    color: design.inkMute,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    backgroundColor: design.canvas,
    paddingHorizontal: 12,
    color: design.ink,
    fontSize: 15,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: design.ink,
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: design.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  primaryPressed: {
    backgroundColor: design.emeraldDeep,
  },
  primaryButtonText: {
    color: design.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryDangerButton: {
    minHeight: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b4ab',
    backgroundColor: design.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  secondaryDangerText: {
    color: design.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsList: {
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: design.hairline,
    paddingTop: 10,
  },
  searchRowBody: {
    flex: 1,
    gap: 4,
  },
  searchRowTitle: {
    color: design.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  searchRowMeta: {
    color: design.inkMute,
    fontSize: 13,
  },
  primaryInlineButton: {
    minHeight: 34,
    borderRadius: 6,
    backgroundColor: design.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryInlineButtonText: {
    color: design.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  helper: {
    color: design.inkMute,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: design.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: design.hairline,
    borderRadius: 12,
    backgroundColor: design.canvas,
    padding: 12,
    gap: 10,
  },
  itemCardSelected: {
    borderColor: design.emerald,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemMain: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  poster: {
    width: 54,
    height: 81,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  posterFallback: {
    backgroundColor: '#e5e7eb',
  },
  itemBody: {
    flex: 1,
    gap: 6,
  },
  itemTitle: {
    color: design.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  itemMeta: {
    color: design.inkMute,
    fontSize: 13,
    lineHeight: 18,
  },
  itemAuthor: {
    color: design.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  removeChip: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0b4ab',
    backgroundColor: design.canvas,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removeChipText: {
    color: design.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  greenPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: design.emerald,
  },
  softPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: design.canvasSoft,
    borderWidth: 1,
    borderColor: design.hairline,
  },
  pillText: {
    color: design.ink,
    fontSize: 12,
    fontWeight: '500',
  },
  rowAction: {
    color: design.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
