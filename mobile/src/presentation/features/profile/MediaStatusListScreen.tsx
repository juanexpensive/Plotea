import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { MediaStatusListItem, useMediaStatusListViewModel } from './MediaStatusListViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

export default function MediaStatusListScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { title, items, loading, error, openDetail } = useMediaStatusListViewModel(status);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nada guardado todavia.</Text>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <MediaStatusCard
              key={`${item.media_type}-${item.tmdb_id}`}
              item={item}
              onPress={() => openDetail(item)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MediaStatusCard({ item, onPress }: { item: MediaStatusListItem; onPress: () => void }) {
  const title =
    item.detail?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onPress}>
      {item.detail?.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.detail.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  centered: sharedStyles.centered,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: sharedStyles.title,
  count: sharedStyles.captionMuted,
  emptyText: sharedStyles.captionMuted,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.md,
  },
  card: {
    width: 110,
  },
  pressed: {
    opacity: 0.72,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  cardTitle: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  errorText: sharedStyles.errorText,
});
