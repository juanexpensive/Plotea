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
        <ActivityIndicator size="large" color="#fff" />
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
                placeholderTextColor="#777"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description ?? ''}
                onChangeText={(value) => updateForm({ description: value })}
                placeholder="Descripcion"
                placeholderTextColor="#777"
                multiline
              />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Lista publica</Text>
                <Switch
                  value={form.is_public}
                  onValueChange={(value) => updateForm({ is_public: value })}
                  trackColor={{ false: '#333', true: '#2563eb' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.actionsRow}>
                <Pressable style={styles.primaryButton} onPress={saveMetadata} disabled={saving}>
                  <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
                <Pressable style={styles.dangerButton} onPress={handleDeleteList} disabled={deleting}>
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
                placeholderTextColor="#777"
              />
              {searchLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
              {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
              <View style={styles.searchResults}>
                {searchResults.slice(0, 6).map((item) => (
                  <Pressable key={`${item.media_type}-${item.tmdb_id}`} style={styles.searchRow} onPress={() => handleAddItem(item)}>
                    <Text style={styles.searchRowTitle}>{item.title}</Text>
                    <Text style={styles.searchRowMeta}>{item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #{item.tmdb_id}</Text>
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
            Posicion {item.position + 1} · {item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #{item.tmdb_id}
          </Text>
        </View>
      </Pressable>
      {editable && onRemove ? (
        <Pressable style={styles.removeButton} onPress={onRemove}>
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
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  ownerMeta: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    color: '#cfcfcf',
    fontSize: 14,
    lineHeight: 21,
  },
  editorCard: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    backgroundColor: '#181818',
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
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
    minHeight: 92,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#ddd',
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  dangerButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dangerButtonText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
  },
  searchResults: {
    gap: 10,
  },
  searchRow: {
    borderTopWidth: 1,
    borderTopColor: '#2b2b2b',
    paddingTop: 10,
  },
  searchRowTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  searchRowMeta: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  helper: {
    color: '#93c5fd',
    fontSize: 13,
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    backgroundColor: '#171717',
    padding: 12,
    gap: 10,
  },
  itemCardSelected: {
    borderColor: '#93c5fd',
    backgroundColor: '#13202d',
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
    backgroundColor: '#333',
  },
  posterFallback: {
    backgroundColor: '#2f2f2f',
  },
  itemBody: {
    flex: 1,
    gap: 6,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
  removeButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#5b2828',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
});
