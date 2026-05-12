import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { getUserPublicLists } from '../../../data/repositories/ListsRepository';
import { followUser, getPublicProfile, getUserStats, unfollowUser } from '../../../data/repositories/SocialRepository';
import { ListSummary } from '../../../domain/entities/lists';
import { PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function usePublicProfileViewModel(username: string | undefined) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFollow, setSavingFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!username) {
        setError('Username invalido.');
        setStats(null);
        setStatsLoading(false);
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setError(null);
      setStats(null);
      setStatsError(null);

      Promise.all([getPublicProfile(username), getUserPublicLists(username)])
        .then(([data, publicLists]) => {
          if (active) {
            setProfile(data);
            setLists(publicLists);
            setStatsLoading(true);
            getUserStats(username)
              .then((nextStats) => {
                if (active) {
                  setStats(nextStats);
                }
              })
              .catch((statsError) => {
                if (!active) {
                  return;
                }

                if (isUnauthorizedError(statsError)) {
                  router.replace('/login');
                  return;
                }

                setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
              })
              .finally(() => {
                if (active) {
                  setStatsLoading(false);
                }
              });
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

          setError(getApiErrorMessage(error, 'Error al cargar el perfil publico.'));
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [username]),
  );

  async function toggleFollow() {
    if (!profile || savingFollow) {
      return;
    }

    setSavingFollow(true);
    setError(null);

    const nextIsFollowing = !profile.is_following;
    const nextFollowersCount = Math.max(0, profile.followers_count + (nextIsFollowing ? 1 : -1));

    setProfile({
      ...profile,
      is_following: nextIsFollowing,
      followers_count: nextFollowersCount,
    });

    try {
      if (nextIsFollowing) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }

      setProfile(profile);
      setError(getApiErrorMessage(error, 'No se pudo actualizar el follow.'));
    } finally {
      setSavingFollow(false);
    }
  }

  return {
    profile,
    lists,
    stats,
    loading,
    savingFollow,
    statsLoading,
    error,
    statsError,
    toggleFollow,
  };
}
