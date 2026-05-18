import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getMediaDetail, getMyMediaStatuses } from '../../../data/repositories/MediaRepository';
import { MediaDetail, SavedMediaStatus } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

type RandomWatchlistPick = SavedMediaStatus & {
  detail: MediaDetail;
};

type RandomWatchlistPickModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function RandomWatchlistPickModal({ visible, onClose }: RandomWatchlistPickModalProps) {
  const [pick, setPick] = useState<RandomWatchlistPick | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    void loadRandomPick();
  }, [visible]);

  async function loadRandomPick() {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      const statuses = await getMyMediaStatuses();
      const watchlist = statuses.watchlist;
      const movieWatchlist = watchlist.filter((item) => item.media_type === 'movie');
      const candidatePool = movieWatchlist.length > 0 ? movieWatchlist : watchlist;

      if (candidatePool.length === 0) {
        if (requestIdRef.current === requestId) {
          setPick(null);
          setIsEmpty(true);
        }
        return;
      }

      const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      const detail = await getMediaDetail(selected.media_type, selected.tmdb_id);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setPick({ ...selected, detail });
    } catch (nextError) {
      if (isUnauthorizedError(nextError)) {
        router.replace('/login');
        return;
      }

      if (requestIdRef.current === requestId) {
        setPick(null);
        setError(getApiErrorMessage(nextError, 'No se pudo elegir una sugerencia random.'));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }

  function openDetail() {
    if (!pick) {
      return;
    }

    onClose();
    router.push({
      pathname: '/detail',
      params: {
        media_type: pick.media_type,
        tmdb_id: String(pick.tmdb_id),
      },
    });
  }

  const posterUri = pick?.detail.poster_path ? `${TMDB_IMAGE}${pick.detail.poster_path}` : null;
  const mediaLabel = pick?.media_type === 'tv' ? 'Serie' : 'Pelicula';
  const releaseYear = pick?.detail.release_date ? pick.detail.release_date.slice(0, 4) : null;
  const ratingText = pick ? pick.detail.vote_average.toFixed(1) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Pick random</Text>
              <Text style={styles.title}>Que veo hoy</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={darkDesign.colors.textSoft} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={darkDesign.colors.accent} />
              <Text style={styles.stateText}>Buscando algo bueno en tu watchlist...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!loading && isEmpty ? (
            <View style={styles.stateBox}>
              <Ionicons name="star-outline" size={28} color={darkDesign.colors.textFaint} />
              <Text style={styles.emptyTitle}>Tu watchlist esta vacia.</Text>
              <Text style={styles.stateText}>Guarda algunas peliculas o series y te elegimos una al azar.</Text>
            </View>
          ) : null}

          {!loading && !error && !isEmpty && pick ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {posterUri ? (
                <Image source={{ uri: posterUri }} style={styles.poster} />
              ) : (
                <View style={[styles.poster, styles.posterFallback]}>
                  <Ionicons name="film-outline" size={28} color={darkDesign.colors.textFaint} />
                </View>
              )}

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{mediaLabel}</Text>
                </View>
                {releaseYear ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>{releaseYear}</Text>
                  </View>
                ) : null}
                {ratingText ? (
                  <View style={[styles.metaPill, styles.metaPillAccent]}>
                    <Text style={styles.metaPillTextAccent}>Nota media {ratingText}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.pickTitle}>{pick.detail.title}</Text>
              <Text style={styles.description}>
                {pick.detail.overview?.trim() ? pick.detail.overview : 'No hay descripcion disponible todavia.'}
              </Text>
            </ScrollView>
          ) : null}

          <View style={styles.footer}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cerrar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressed : null,
                loading ? styles.disabled : null,
              ]}
              onPress={() => void loadRandomPick()}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Otra random</Text>
            </Pressable>
          </View>

          {!loading && !error && !isEmpty && pick ? (
            <Pressable style={styles.detailLink} onPress={openDetail}>
              <Text style={styles.detailLinkText}>Ver ficha completa</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '84%',
    borderRadius: darkDesign.radii.xl,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.panelStrong,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.lg,
    ...darkDesign.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: {
    color: darkDesign.colors.text,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  content: {
    gap: darkDesign.spacing.lg,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.sm,
  },
  metaPill: {
    borderRadius: darkDesign.radii.pill,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: 6,
  },
  metaPillAccent: {
    borderColor: darkDesign.colors.accent,
    backgroundColor: 'rgba(62, 207, 142, 0.12)',
  },
  metaPillText: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  metaPillTextAccent: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  pickTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  description: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
  },
  stateBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
  },
  stateText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: darkDesign.spacing.sm,
  },
  primaryButton: {
    ...sharedStyles.primaryButton,
    flex: 1,
  },
  primaryButtonText: sharedStyles.primaryButtonText,
  secondaryButton: {
    ...sharedStyles.secondaryButton,
    flex: 1,
  },
  secondaryButtonText: sharedStyles.secondaryButtonText,
  detailLink: {
    alignSelf: 'center',
    paddingVertical: darkDesign.spacing.xs,
  },
  detailLinkText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
  errorText: sharedStyles.errorText,
});
