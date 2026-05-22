import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getSocialFeed, getVisualSocialFeed } from '../../../data/repositories/SocialRepository';
import { ActivityItem, VisualFeedItem } from '../../../domain/entities/social';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

const INITIAL_FEED_LIMIT = 5;
const LOAD_MORE_FEED_LIMIT = 20;

export function useSocialViewModel() {
  const [visualItems, setVisualItems] = useState<VisualFeedItem[]>([]);
  const [visualLoading, setVisualLoading] = useState(true);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<ActivityItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;

    setVisualLoading(true);
    setVisualError(null);
    setFeedError(null);
    if (feedItems.length === 0) {
      setFeedLoading(true);
    } else {
      setFeedRefreshing(true);
    }

    getVisualSocialFeed()
      .then((items) => {
        if (active) {
          setVisualItems(items);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (redirectToLoginIfUnauthorized(error)) {
          return;
        }
        setVisualError(getApiErrorMessage(error, 'No se pudo cargar el resumen visual.'));
      })
      .finally(() => {
        if (active) {
          setVisualLoading(false);
        }
      });

    getSocialFeed(null, INITIAL_FEED_LIMIT)
      .then((page) => {
        if (active) {
          setFeedItems(page.items);
          setNextCursor(page.next_cursor);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (redirectToLoginIfUnauthorized(error)) {
          return;
        }
        setFeedError(getApiErrorMessage(error, 'Error al cargar la actividad social.'));
      })
      .finally(() => {
        if (active) {
          setFeedLoading(false);
          setFeedRefreshing(false);
          setFeedLoadingMore(false);
        }
      });

    return () => {
      active = false;
    };
  }, [feedItems.length]);

  useFocusEffect(load);

  async function loadMoreFeed() {
    if (feedLoading || feedRefreshing || feedLoadingMore || nextCursor === null) {
      return;
    }

    setFeedLoadingMore(true);
    try {
      const page = await getSocialFeed(nextCursor, LOAD_MORE_FEED_LIMIT);
      setFeedItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.next_cursor);
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setFeedError(getApiErrorMessage(error, 'Error al cargar mas actividad.'));
    } finally {
      setFeedLoadingMore(false);
    }
  }

  function openUserProfile(username: string) {
    router.push({ pathname: '/user-profile', params: { username } });
  }

  function openListDetail(listId: number) {
    router.push({ pathname: '/list-detail', params: { list_id: listId } });
  }

  function openMediaDetail(mediaType: 'movie' | 'tv', tmdbId: number) {
    router.push({ pathname: '/detail', params: { media_type: mediaType, tmdb_id: String(tmdbId) } });
  }

  return {
    visualItems,
    visualLoading,
    visualError,
    feedItems,
    feedLoading,
    feedRefreshing,
    feedLoadingMore,
    feedError,
    loadMoreFeed,
    openUserProfile,
    openListDetail,
    openMediaDetail,
  };
}
