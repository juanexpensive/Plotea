import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { followUser, getPublicProfile, unfollowUser } from '../../../data/repositories/SocialRepository';
import { PublicUserProfile } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function usePublicProfileViewModel(username: string | undefined) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFollow, setSavingFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!username) {
        setError('Username invalido.');
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setError(null);

      getPublicProfile(username)
        .then((data) => {
          if (active) {
            setProfile(data);
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
    loading,
    savingFollow,
    error,
    toggleFollow,
  };
}
