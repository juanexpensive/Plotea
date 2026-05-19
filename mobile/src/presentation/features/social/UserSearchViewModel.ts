import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { searchUsers } from '../../../data/repositories/SocialRepository';
import { getCurrentUser } from '../../../data/repositories/AuthRepository';
import { PublicUserSummary } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function useUserSearchViewModel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user) => {
        if (active) {
          setCurrentUsername(user.username);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUsername(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      searchUsers(trimmedQuery)
        .then((users) => {
          if (searchRequestId.current === requestId) {
            setResults(users.filter((user) => user.username !== currentUsername));
          }
        })
        .catch((error) => {
          if (searchRequestId.current !== requestId) {
            return;
          }

          if (isUnauthorizedError(error)) {
            router.replace('/login');
            return;
          }

          setResults([]);
          setError(getApiErrorMessage(error, 'Error al buscar usuarios.'));
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentUsername, query]);

  function openProfile(username: string) {
    if (username === currentUsername) {
      router.push('/(tabs)/profile');
      return;
    }

    router.push({ pathname: '/user-profile', params: { username } });
  }

  return {
    query,
    results,
    loading,
    error,
    isSearching: query.trim().length >= 2,
    setQuery,
    openProfile,
  };
}
