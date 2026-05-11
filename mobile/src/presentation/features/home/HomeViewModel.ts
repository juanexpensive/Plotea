import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getHomeFeed, searchMedia } from '../../../data/repositories/MediaRepository';
import { getSocialFeed } from '../../../data/repositories/SocialRepository';
import { HomeFeed, MediaItem } from '../../../domain/entities/media';
import { ActivityItem } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function useHomeViewModel() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialItems, setSocialItems] = useState<ActivityItem[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialRefreshing, setSocialRefreshing] = useState(false);
  const [socialLoadingMore, setSocialLoadingMore] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    getHomeFeed()
      .then(setFeed)
      .catch((error) => setError(getApiErrorMessage(error, 'Error al cargar el contenido.')))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSocialFeed(true);
    }, []),
  );

  useEffect(() => {
    const trimmedQuery = query.trim();
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    const timeoutId = setTimeout(() => {
      searchMedia(trimmedQuery)
        .then((results) => {
          if (searchRequestId.current === requestId) {
            setSearchResults(results);
          }
        })
        .catch((error) => {
          if (searchRequestId.current === requestId) {
            setSearchResults([]);
            setSearchError(getApiErrorMessage(error, 'Error al buscar contenido.'));
          }
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSearchLoading(false);
          }
        });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function clearSearch() {
    setQuery('');
  }

  async function loadSocialFeed(refresh: boolean) {
    if (refresh) {
      setSocialError(null);
      if (socialItems.length === 0) {
        setSocialLoading(true);
      } else {
        setSocialRefreshing(true);
      }
    }

    try {
      const page = await getSocialFeed(refresh ? undefined : nextCursor);
      setSocialItems((previous) => {
        if (refresh) {
          return page.items;
        }

        const seen = new Set(previous.map((item) => item.id));
        return [...previous, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.next_cursor);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }

      setSocialError(getApiErrorMessage(error, 'Error al cargar la actividad social.'));
      if (refresh) {
        setSocialItems([]);
        setNextCursor(null);
      }
    } finally {
      setSocialLoading(false);
      setSocialRefreshing(false);
      setSocialLoadingMore(false);
    }
  }

  async function refreshSocialFeed() {
    await loadSocialFeed(true);
  }

  async function loadMoreSocialFeed() {
    if (socialLoading || socialRefreshing || socialLoadingMore || nextCursor === null) {
      return;
    }

    setSocialLoadingMore(true);
    await loadSocialFeed(false);
  }

  function openUserSearch() {
    router.push('/user-search');
  }

  function openUserProfile(username: string) {
    router.push({ pathname: '/user-profile', params: { username } });
  }

  return {
    feed,
    loading,
    error,
    socialItems,
    socialLoading,
    socialRefreshing,
    socialLoadingMore,
    socialError,
    query,
    searchResults,
    searchLoading,
    searchError,
    isSearching: query.trim().length >= 2,
    setQuery,
    clearSearch,
    openUserSearch,
    openUserProfile,
    refreshSocialFeed,
    loadMoreSocialFeed,
  };
}
