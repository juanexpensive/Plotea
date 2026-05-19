import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getCurrentUser } from '../../../data/repositories/AuthRepository';
import { followUser, getMyFollowers, getMyFollowing, unfollowUser } from '../../../data/repositories/SocialRepository';
import { PublicUserSummary } from '../../../domain/entities/social';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

export type ProfileNetworkTab = 'followers' | 'following';

function sortUsers(users: PublicUserSummary[]) {
  return [...users].sort((left, right) => left.username.localeCompare(right.username, 'es'));
}

function replaceUser(users: PublicUserSummary[], nextUser: PublicUserSummary) {
  return users.map((user) => (user.id === nextUser.id ? nextUser : user));
}

function upsertFollowingUser(users: PublicUserSummary[], nextUser: PublicUserSummary) {
  const existingUser = users.find((user) => user.id === nextUser.id);
  if (existingUser) {
    return replaceUser(users, nextUser);
  }

  return sortUsers([...users, nextUser]);
}

function removeFollowingUser(users: PublicUserSummary[], userId: number) {
  return users.filter((user) => user.id !== userId);
}

export function useProfileNetworkViewModel(initialTab: string | undefined) {
  const [activeTab, setActiveTab] = useState<ProfileNetworkTab>(initialTab === 'following' ? 'following' : 'followers');
  const [followers, setFollowers] = useState<PublicUserSummary[]>([]);
  const [following, setFollowing] = useState<PublicUserSummary[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);

      Promise.all([getCurrentUser(), getMyFollowers(), getMyFollowing()])
        .then(([currentUser, nextFollowers, nextFollowing]) => {
          if (!active) {
            return;
          }

          setCurrentUsername(currentUser.username);
          setFollowers(sortUsers(nextFollowers));
          setFollowing(sortUsers(nextFollowing));
        })
        .catch((nextError) => {
          if (!active) {
            return;
          }

        if (redirectToLoginIfUnauthorized(nextError)) {
          return;
        }

        setError(getApiErrorMessage(nextError, 'No se pudo cargar tu red.'));
      })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  async function toggleFollow(user: PublicUserSummary) {
    if (pendingUserId !== null) {
      return;
    }

    const nextIsFollowing = !user.is_following;
    const nextUser = { ...user, is_following: nextIsFollowing };

    setPendingUserId(user.id);
    setError(null);
    setFollowers((current) => replaceUser(current, nextUser));
    setFollowing((current) => (nextIsFollowing ? upsertFollowingUser(current, nextUser) : removeFollowingUser(current, user.id)));

    try {
      if (nextIsFollowing) {
        await followUser(user.id);
      } else {
        await unfollowUser(user.id);
      }
    } catch (nextError) {
      if (redirectToLoginIfUnauthorized(nextError)) {
        return;
      }

      setFollowers((current) => replaceUser(current, user));
      setFollowing((current) => (user.is_following ? upsertFollowingUser(current, user) : removeFollowingUser(current, user.id)));
      setError(getApiErrorMessage(nextError, 'No se pudo actualizar el follow.'));
    } finally {
      setPendingUserId(null);
    }
  }

  function openProfile(username: string) {
    if (username === currentUsername) {
      router.push('/(tabs)/profile');
      return;
    }

    router.push({ pathname: '/user-profile', params: { username } });
  }

  return {
    activeTab,
    followers,
    following,
    loading,
    error,
    pendingUserId,
    setActiveTab,
    toggleFollow,
    openProfile,
  };
}
