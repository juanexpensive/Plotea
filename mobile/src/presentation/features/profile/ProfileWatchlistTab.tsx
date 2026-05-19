import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { uiCopy } from '../../shared/uiCopy';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { SavedMediaStatusEnriched } from '../../../domain/entities/media';
import { MediaStatusListItem } from './MediaStatusListViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';

export type WatchlistItem = MediaStatusListItem | SavedMediaStatusEnriched;

type ProfileWatchlistTabProps = {
  username: string;
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  onOpenDetail: (item: WatchlistItem) => void;
};

export function ProfileWatchlistTab({
  username,
  items,
  loading,
  error,
  onOpenDetail,
}: ProfileWatchlistTabProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <PlotStarLoader size="large" label="Cargando watchlist..." />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.heroSection}>
        <Text style={styles.eyebrow}>{uiCopy.tabs.watchlist}</Text>
        <Text style={styles.title}>{`Pendientes de ${username}`}</Text>
        <Text style={styles.subtitle}>
          {items.length === 0 ? 'Tu proxima obsesion empieza aqui.' : `${items.length} titulos guardados`}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Todavia no has guardado nada.</Text>
          <Text style={styles.emptyText}>Marca peliculas o series para que tu lista de pendientes empiece a tomar forma.</Text>
        </View>
      ) : (
        <View style={styles.posterGrid}>
          {items.map((item, index) => (
            <View
              key={`${item.media_type}-${item.tmdb_id}`}
              style={[styles.gridCell, index % 4 === 3 ? styles.gridCellLast : null]}
            >
              <Pressable
                style={({ pressed }) => [styles.posterTile, pressed ? styles.pressed : null]}
                onPress={() => onOpenDetail(item)}
              >
                {getPosterPath(item) ? (
                  <Image source={{ uri: `${TMDB_IMAGE}${getPosterPath(item)}` }} style={styles.posterImage} />
                ) : (
                  <View style={[styles.posterImage, styles.posterFallback]} />
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getPosterPath(item: WatchlistItem) {
  if ('media' in item) {
    return item.media.poster_path;
  }

  return item.detail?.poster_path ?? null;
}

const styles = StyleSheet.create({
  content: {
    gap: darkDesign.spacing.xl,
  },
  centered: sharedStyles.centered,
  heroSection: {
    gap: darkDesign.spacing.sm,
  },
  eyebrow: {
    color: darkDesign.colors.textFaint,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    ...darkDesign.typography.micro,
  },
  title: {
    color: darkDesign.colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  subtitle: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
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
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    opacity: 0.92,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
  },
  emptyState: {
    ...sharedStyles.panel,
    paddingVertical: darkDesign.spacing.xxl,
  },
  emptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  emptyText: sharedStyles.captionMuted,
  pressed: sharedStyles.pressed,
  errorText: sharedStyles.errorText,
});
