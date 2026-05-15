import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getSocialFeed, getVisualSocialFeed } from '../../../data/repositories/SocialRepository';
import { ActivityItem, VisualFeedItem } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

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
        if (isUnauthorizedError(error)) {
          router.replace('/login');
          return;
        }
        setVisualError(getApiErrorMessage(error, 'No se pudo cargar el resumen visual.'));
        setVisualItems([]);
      })
      .finally(() => {
        if (active) {
          setVisualLoading(false);
        }
      });

    getSocialFeed()
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
        if (isUnauthorizedError(error)) {
          router.replace('/login');
          return;
        }
        setFeedError(getApiErrorMessage(error, 'Error al cargar la actividad social.'));
        setFeedItems([]);
        setNextCursor(null);
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
      const page = await getSocialFeed(nextCursor);
      setFeedItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.next_cursor);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setFeedError(getApiErrorMessage(error, 'Error al cargar mas actividad.'));
    } finally {
      setFeedLoadingMore(false);
    }
  }

  function openUserSearch() {
    router.push('/user-search');
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
    openUserSearch,
    openUserProfile,
    openListDetail,
    openMediaDetail,
  };
}
