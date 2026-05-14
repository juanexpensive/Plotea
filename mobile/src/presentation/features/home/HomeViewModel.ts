import { useEffect, useRef, useState } from 'react';
import { getHomeFeed, searchMedia } from '../../../data/repositories/MediaRepository';
import { HomeFeed, MediaItem } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useHomeViewModel() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return {
    feed,
    loading,
    error,
    query,
    searchResults,
    searchLoading,
    searchError,
    isSearching: query.trim().length >= 2,
    setQuery,
    clearSearch,
  };
}
