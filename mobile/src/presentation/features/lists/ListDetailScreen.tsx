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
import { ListItem } from '../../../domain/entities/lists';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useListDetailViewModel } from './ListDetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ListDetailScreen() {
  const { list_id, editable } = useLocalSearchParams<{ list_id?: string; editable?: string }>();
  const listId = list_id ? Number(list_id) : null;
  const canEdit = editable === '1';
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
    setQuery,
    updateForm,
    saveMetadata,
    handleDeleteList,
    handleAddItem,
    handleRemoveItem,
    swapItems,
    openOwnerProfile,
  } = useListDetailViewModel(listId, canEdit);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
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
          <Text style={styles.title}>{detail.name}</Text>
          <Pressable onPress={openOwnerProfile}>
            <Text style={styles.ownerMeta}>por @{detail.owner.username}</Text>
          </Pressable>
          {detail.description ? <Text style={styles.description}>{detail.description}</Text> : null}

          {canEdit ? (
            <View style={styles.editorCard}>
              <Text style={styles.cardTitle}>Editar lista</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) => updateForm({ name: value })}
                placeholder="Nombre"
                placeholderTextColor={darkDesign.colors.textFaint}
                selectionColor={darkDesign.colors.accent}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description ?? ''}
                onChangeText={(value) => updateForm({ description: value })}
                placeholder="Descripcion"
                placeholderTextColor={darkDesign.colors.textFaint}
                multiline
                selectionColor={darkDesign.colors.accent}
              />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Lista publica</Text>
                <Switch
                  value={form.is_public}
                  onValueChange={(value) => updateForm({ is_public: value })}
                  trackColor={{ false: darkDesign.colors.borderStrong, true: darkDesign.colors.accentDeep }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null, saving ? styles.disabled : null]}
                  onPress={saveMetadata}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null, deleting ? styles.disabled : null]}
                  onPress={handleDeleteList}
                  disabled={deleting}
                >
                  <Text style={styles.dangerButtonText}>{deleting ? 'Borrando...' : 'Borrar'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {canEdit ? (
            <View style={styles.editorCard}>
              <Text style={styles.cardTitle}>Anadir obra</Text>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Busca una pelicula o serie"
                placeholderTextColor={darkDesign.colors.textFaint}
                selectionColor={darkDesign.colors.accent}
              />
              {searchLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
              {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
              <View style={styles.searchResults}>
                {searchResults.slice(0, 6).map((item) => (
                  <Pressable
                    key={`${item.media_type}-${item.tmdb_id}`}
                    style={({ pressed }) => [styles.searchRow, pressed ? styles.pressed : null]}
                    onPress={() => handleAddItem(item)}
                  >
                    <Text style={styles.searchRowTitle}>{item.title}</Text>
                    <Text style={styles.searchRowMeta}>{`${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`}</Text>
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
  const opacity = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: selected ? 1.02 : 1, duration: 140, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: selected ? 1 : 0.96, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, selected]);

  const title = item.media_summary?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;

  return (
    <Animated.View
      style={[
        styles.itemCard,
        selected ? styles.itemCardSelected : null,
        { transform: [{ scale }], opacity },
      ]}
    >
      <Pressable style={styles.itemMain} onPress={onPress}>
        {item.media_summary?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${item.media_summary.poster_path}` }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemMeta}>
            {`Posicion ${item.position + 1} - ${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`}
          </Text>
        </View>
      </Pressable>
      {editable && onRemove ? (
        <Pressable style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]} onPress={onRemove}>
          <Text style={styles.removeButtonText}>Quitar</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function toItemKey(item: ListItem) {
  return `${item.media_type}-${item.tmdb_id}`;
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: {
    ...sharedStyles.scrollContent,
    paddingTop: 20,
  },
  centered: sharedStyles.centered,
  title: {
    ...sharedStyles.title,
    marginTop: 8,
  },
  ownerMeta: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  description: sharedStyles.body,
  editorCard: sharedStyles.panel,
  cardTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  input: sharedStyles.input,
  textArea: {
    ...sharedStyles.textArea,
    minHeight: 92,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: sharedStyles.body,
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    ...sharedStyles.primaryButton,
    flex: 1,
    minHeight: 42,
  },
  primaryButtonText: sharedStyles.primaryButtonText,
  dangerButton: {
    ...sharedStyles.dangerButton,
    flex: 1,
    minHeight: 42,
  },
  dangerButtonText: sharedStyles.dangerButtonText,
  searchResults: {
    gap: 10,
  },
  searchRow: {
    borderTopWidth: 1,
    borderTopColor: darkDesign.colors.border,
    paddingTop: 10,
  },
  searchRowTitle: {
    color: darkDesign.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  searchRowMeta: {
    ...sharedStyles.captionMuted,
    marginTop: 4,
  },
  helper: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
  },
  errorText: sharedStyles.errorText,
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: 14,
    backgroundColor: darkDesign.colors.panel,
    padding: 12,
    gap: 10,
  },
  itemCardSelected: {
    borderColor: darkDesign.colors.accent,
    backgroundColor: darkDesign.colors.panelStrong,
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
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  itemBody: {
    flex: 1,
    gap: 6,
  },
  itemTitle: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    ...sharedStyles.captionMuted,
    lineHeight: 18,
  },
  removeButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: '#7a3030',
    backgroundColor: '#2a1515',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  removeButtonText: sharedStyles.dangerButtonText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
