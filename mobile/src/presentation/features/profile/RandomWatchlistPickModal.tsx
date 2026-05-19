import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getListDetail, getMyLists } from '../../../data/repositories/ListsRepository';
import { getMediaDetail, getMyMediaStatuses } from '../../../data/repositories/MediaRepository';
import { getMyFollowing, getUserWatchlist } from '../../../data/repositories/SocialRepository';
import { MediaDetail, SavedMediaStatus } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';
import { formatTmdbScore, getMediaTypeLabel } from '../../shared/mediaPresentation';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import {
  RandomPickFollowingOption,
  RandomPickListOption,
  RandomPickSource,
  pickRandomCandidate,
  resolveRandomPickSource,
  toRandomPickListOptions,
  toSavedStatusesFromList,
} from './randomPickSources';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

type RandomWatchlistPick = SavedMediaStatus & {
  detail: MediaDetail;
};

type EmptyState = {
  title: string;
  body: string;
};

type RandomWatchlistPickModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DEFAULT_SOURCE: RandomPickSource = { kind: 'watchlist:mine' };

export function RandomWatchlistPickModal({ visible, onClose }: RandomWatchlistPickModalProps) {
  const [pick, setPick] = useState<RandomWatchlistPick | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyState, setEmptyState] = useState<EmptyState | null>(null);
  const [source, setSource] = useState<RandomPickSource>(DEFAULT_SOURCE);
  const [sourceLabel, setSourceLabel] = useState('Tu watchlist');
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [listOptions, setListOptions] = useState<RandomPickListOption[]>([]);
  const [followingOptions, setFollowingOptions] = useState<RandomPickFollowingOption[]>([]);
  const requestIdRef = useRef(0);
  const filterRequestIdRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      setIsFilterVisible(false);
      return;
    }

    void loadRandomPick(source);
  }, [visible]);

  async function loadRandomPick(nextSource: RandomPickSource) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setEmptyState(null);
    setSourceNotice(null);

    try {
      const resolution = await resolveRandomPickSource(nextSource, {
        async getMyWatchlist() {
          const statuses = await getMyMediaStatuses();
          return statuses.watchlist;
        },
        async getSelectableLists() {
          const overview = await getMyLists();
          return toRandomPickListOptions([...overview.owned_lists, ...overview.shared_lists]);
        },
        async getListItems(listId: number) {
          const detail = await getListDetail(listId);
          return toSavedStatusesFromList(detail.items);
        },
        async getFollowing() {
          const following = await getMyFollowing();
          return following.map((item) => ({
            id: item.id,
            username: item.username,
            display_name: item.display_name,
            avatar_url: item.avatar_url,
          }));
        },
        getUserWatchlist,
      });

      if (resolution.kind === 'unauthorized') {
        router.replace('/login');
        return;
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!isSameSource(source, resolution.effectiveSource)) {
        setSource(resolution.effectiveSource);
      }

      setSourceLabel(resolution.sourceLabel);
      setSourceNotice(resolution.notice);

      const selected = pickRandomCandidate(resolution.candidates);
      if (!selected) {
        setPick(null);
        setEmptyState({
          title: resolution.emptyTitle,
          body: resolution.emptyBody,
        });
        return;
      }

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

  async function loadFilterOptions() {
    const requestId = filterRequestIdRef.current + 1;
    filterRequestIdRef.current = requestId;

    setFilterLoading(true);
    setFilterError(null);

    try {
      const [overview, following] = await Promise.all([getMyLists(), getMyFollowing()]);
      if (filterRequestIdRef.current !== requestId) {
        return;
      }

      setListOptions(toRandomPickListOptions([...overview.owned_lists, ...overview.shared_lists]));
      setFollowingOptions(
        following.map((item) => ({
          id: item.id,
          username: item.username,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
        })),
      );
    } catch (nextError) {
      if (isUnauthorizedError(nextError)) {
        router.replace('/login');
        return;
      }

      if (filterRequestIdRef.current === requestId) {
        setFilterError(getApiErrorMessage(nextError, 'No se pudieron cargar las opciones del filtro.'));
      }
    } finally {
      if (filterRequestIdRef.current === requestId) {
        setFilterLoading(false);
      }
    }
  }

  function openFilterModal() {
    setIsFilterVisible(true);
    void loadFilterOptions();
  }

  function applySource(nextSource: RandomPickSource) {
    setIsFilterVisible(false);
    setSource(nextSource);
    if (visible) {
      void loadRandomPick(nextSource);
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
  const mediaLabel = pick ? getMediaTypeLabel(pick.media_type) : null;
  const releaseYear = pick?.detail.release_date ? pick.detail.release_date.slice(0, 4) : null;
  const ratingText = pick ? pick.detail.vote_average.toFixed(1) : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Pressable style={styles.iconButton} onPress={openFilterModal}>
                <Ionicons name="options-outline" size={20} color={darkDesign.colors.textSoft} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Pick random</Text>
                <Text style={styles.title}>Que veo hoy</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={darkDesign.colors.textSoft} />
              </Pressable>
            </View>

            <View style={styles.sourceBanner}>
              <Text style={styles.sourceBannerLabel}>Fuente activa</Text>
              <Text style={styles.sourceBannerValue}>{sourceLabel}</Text>
            </View>

            {sourceNotice ? <Text style={styles.noticeText}>{sourceNotice}</Text> : null}

            {loading ? (
              <View style={styles.stateBox}>
                <PlotStarLoader size="large" label="Buscando algo bueno..." />
                <Text style={styles.stateText}>Buscando algo bueno en la fuente que has elegido...</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!loading && emptyState ? (
              <View style={styles.stateBox}>
                <Ionicons name="star-outline" size={28} color={darkDesign.colors.textFaint} />
                <Text style={styles.emptyTitle}>{emptyState.title}</Text>
                <Text style={styles.stateText}>{emptyState.body}</Text>
              </View>
            ) : null}

            {!loading && !error && !emptyState && pick ? (
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
                      <Text style={styles.metaPillTextAccent}>
                        Nota media {formatTmdbScore(pick.detail.vote_average).replace(' / 10', '')}
                      </Text>
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
                onPress={() => void loadRandomPick(source)}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>Otra random</Text>
              </Pressable>
            </View>

            {!loading && !error && !emptyState && pick ? (
              <Pressable style={styles.detailLink} onPress={openDetail}>
                <Text style={styles.detailLinkText}>Ver ficha completa</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>

      <FilterModal
        visible={isFilterVisible}
        loading={filterLoading}
        error={filterError}
        source={source}
        listOptions={listOptions}
        followingOptions={followingOptions}
        onRetry={() => void loadFilterOptions()}
        onClose={() => setIsFilterVisible(false)}
        onSelectMine={() => applySource({ kind: 'watchlist:mine' })}
        onSelectList={(listId) => applySource({ kind: 'list:owned-or-shared', listId })}
        onSelectFollowing={(username) => applySource({ kind: 'watchlist:paired', otherUsername: username })}
      />
    </>
  );
}

function FilterModal({
  visible,
  loading,
  error,
  source,
  listOptions,
  followingOptions,
  onRetry,
  onClose,
  onSelectMine,
  onSelectList,
  onSelectFollowing,
}: {
  visible: boolean;
  loading: boolean;
  error: string | null;
  source: RandomPickSource;
  listOptions: RandomPickListOption[];
  followingOptions: RandomPickFollowingOption[];
  onRetry: () => void;
  onClose: () => void;
  onSelectMine: () => void;
  onSelectList: (listId: number) => void;
  onSelectFollowing: (username: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.filterScreen}>
        <View style={styles.filterHeader}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={darkDesign.colors.text} />
          </Pressable>
          <View style={styles.filterHeaderCopy}>
            <Text style={styles.eyebrow}>Filtro random</Text>
            <Text style={styles.filterTitle}>Elige de donde sale la sugerencia</Text>
          </View>
          <View style={styles.iconSpacer} />
        </View>

        {loading ? (
          <View style={styles.filterState}>
            <PlotStarLoader size="large" label="Cargando filtros..." />
            <Text style={styles.stateText}>Cargando tus listas y las personas que sigues...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.filterState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.secondaryInlineButton} onPress={onRetry}>
              <Text style={styles.secondaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error ? (
          <ScrollView style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Mi watchlist</Text>
              <SourceRow
                title="Tu watchlist"
                subtitle="Saca una pelicula random de tus pendientes."
                selected={source.kind === 'watchlist:mine'}
                onPress={onSelectMine}
              />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Una de tus listas</Text>
              <Text style={styles.sectionBody}>Incluye listas propias y listas compartidas contigo.</Text>
              {listOptions.length === 0 ? (
                <Text style={styles.emptySectionText}>Todavia no tienes listas disponibles para usar como fuente.</Text>
              ) : (
                listOptions.map((item) => (
                  <SourceRow
                    key={item.id}
                    title={item.name}
                    subtitle={`@${item.owner_username} - ${formatCount(item.items_count)}`}
                    selected={source.kind === 'list:owned-or-shared' && source.listId === item.id}
                    onPress={() => onSelectList(item.id)}
                  />
                ))
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2 watchlists</Text>
              <Text style={styles.sectionBody}>Mezcla tu watchlist con la de alguien a quien sigues.</Text>
              {followingOptions.length === 0 ? (
                <Text style={styles.emptySectionText}>Todavia no sigues a nadie, asi que este filtro no esta disponible.</Text>
              ) : (
                followingOptions.map((item) => (
                  <SourceRow
                    key={item.id}
                    title={`@${item.username}`}
                    subtitle={item.display_name ?? 'Watchlist compartida'}
                    selected={source.kind === 'watchlist:paired' && source.otherUsername === item.username}
                    onPress={() => onSelectFollowing(item.username)}
                  />
                ))
              )}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

function SourceRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sourceRow,
        selected ? styles.sourceRowSelected : null,
        pressed ? styles.pressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.sourceRowCopy}>
        <Text style={styles.sourceRowTitle}>{title}</Text>
        <Text style={styles.sourceRowSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

function formatCount(value: number) {
  return value === 1 ? '1 titulo' : `${value} titulos`;
}

function isSameSource(left: RandomPickSource, right: RandomPickSource) {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === 'watchlist:mine' && right.kind === 'watchlist:mine') {
    return true;
  }

  if (left.kind === 'list:owned-or-shared' && right.kind === 'list:owned-or-shared') {
    return left.listId === right.listId;
  }

  if (left.kind === 'watchlist:paired' && right.kind === 'watchlist:paired') {
    return left.otherUsername === right.otherUsername;
  }

  return false;
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
    maxHeight: '86%',
    borderRadius: darkDesign.radii.xl,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.panelStrong,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.md,
    ...darkDesign.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  filterHeaderCopy: {
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
    textAlign: 'center',
  },
  filterTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvasRaised,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  iconSpacer: {
    width: 38,
    height: 38,
  },
  sourceBanner: {
    borderRadius: darkDesign.radii.md,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.sm,
    gap: 2,
  },
  sourceBannerLabel: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceBannerValue: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  noticeText: {
    color: darkDesign.colors.warning,
    ...darkDesign.typography.caption,
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
  secondaryInlineButton: {
    ...sharedStyles.secondaryButton,
    alignSelf: 'center',
    minWidth: 140,
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
  filterScreen: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingTop: darkDesign.spacing.huge,
    paddingBottom: darkDesign.spacing.lg,
    gap: darkDesign.spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  filterScroll: {
    flex: 1,
  },
  filterContent: {
    gap: darkDesign.spacing.lg,
    paddingBottom: darkDesign.spacing.huge,
  },
  filterState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
  },
  sectionCard: {
    borderRadius: darkDesign.radii.xl,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.panel,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.md,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  sectionBody: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  emptySectionText: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.caption,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    borderRadius: darkDesign.radii.md,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.md,
  },
  sourceRowSelected: {
    borderColor: darkDesign.colors.accent,
    backgroundColor: 'rgba(62, 207, 142, 0.12)',
  },
  sourceRowCopy: {
    flex: 1,
    gap: 2,
  },
  sourceRowTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.body,
    fontWeight: '600',
  },
  sourceRowSubtitle: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: darkDesign.colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkDesign.colors.accent,
  },
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
  errorText: sharedStyles.errorText,
});
