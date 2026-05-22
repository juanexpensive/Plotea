import { SavedMediaStatus } from '../../../domain/entities/media';
import { ListSummary } from '../../../domain/entities/lists';
import { PublicUserSummary } from '../../../domain/entities/social';

export type RandomPickSource =
  | { kind: 'watchlist:mine' }
  | { kind: 'list:owned-or-shared'; listId: number }
  | { kind: 'watchlist:paired'; otherUsername: string };

export type RandomPickListOption = Pick<ListSummary, 'id' | 'name' | 'items_count' | 'relationship'> & {
  owner_username: string;
};

export type RandomPickFollowingOption = Pick<PublicUserSummary, 'id' | 'username' | 'display_name' | 'avatar_url'>;

export type RandomPickSourceResolution =
  | {
      kind: 'ready';
      effectiveSource: RandomPickSource;
      candidates: SavedMediaStatus[];
      sourceLabel: string;
      emptyTitle: string;
      emptyBody: string;
      notice: string | null;
    }
  | {
      kind: 'unauthorized';
    };

export type RandomPickSourceServices = {
  getMyWatchlist: () => Promise<SavedMediaStatus[]>;
  getSelectableLists: () => Promise<RandomPickListOption[]>;
  getListItems: (listId: number) => Promise<SavedMediaStatus[]>;
  getFollowing: () => Promise<RandomPickFollowingOption[]>;
  getUserWatchlist: (username: string) => Promise<SavedMediaStatus[]>;
};

export async function resolveRandomPickSource(
  source: RandomPickSource,
  services: RandomPickSourceServices,
): Promise<RandomPickSourceResolution> {
  try {
    if (source.kind === 'watchlist:mine') {
      const watchlist = prioritizeMovieCandidates(await services.getMyWatchlist());
      return {
        kind: 'ready',
        effectiveSource: source,
        candidates: watchlist,
        sourceLabel: 'Tu watchlist',
        emptyTitle: 'Tu watchlist esta vacia.',
        emptyBody: 'Guarda algunas peliculas o series y te elegimos una al azar.',
        notice: null,
      };
    }

    if (source.kind === 'list:owned-or-shared') {
      const lists = await services.getSelectableLists();
      const selectedList = lists.find((item) => item.id === source.listId);

      if (!selectedList) {
        const fallbackWatchlist = prioritizeMovieCandidates(await services.getMyWatchlist());
        return {
          kind: 'ready',
          effectiveSource: { kind: 'watchlist:mine' },
          candidates: fallbackWatchlist,
          sourceLabel: 'Tu watchlist',
          emptyTitle: 'Tu watchlist esta vacia.',
          emptyBody: 'La lista que habias elegido ya no esta disponible, asi que volvimos a tu watchlist.',
          notice: 'La lista elegida ya no esta disponible. Hemos vuelto a tu watchlist.',
        };
      }

      const listItems = prioritizeMovieCandidates(await services.getListItems(selectedList.id));
      return {
        kind: 'ready',
        effectiveSource: source,
        candidates: listItems,
        sourceLabel: `${selectedList.name} - @${selectedList.owner_username}`,
        emptyTitle: `"${selectedList.name}" esta vacia.`,
        emptyBody: 'Anade peliculas o series a esa lista para poder sacar una sugerencia random.',
        notice: null,
      };
    }

    const following = await services.getFollowing();
    const selectedUser = following.find((item) => item.username === source.otherUsername);

    if (!selectedUser) {
      const fallbackWatchlist = prioritizeMovieCandidates(await services.getMyWatchlist());
      return {
        kind: 'ready',
        effectiveSource: { kind: 'watchlist:mine' },
        candidates: fallbackWatchlist,
        sourceLabel: 'Tu watchlist',
        emptyTitle: 'Tu watchlist esta vacia.',
        emptyBody: 'La persona elegida ya no aparece en tus seguidos, asi que volvimos a tu watchlist.',
        notice: 'Ese usuario ya no aparece en tus seguidos. Hemos vuelto a tu watchlist.',
      };
    }

    const [myWatchlist, otherWatchlist] = await Promise.all([
      services.getMyWatchlist(),
      services.getUserWatchlist(selectedUser.username),
    ]);

    return {
      kind: 'ready',
      effectiveSource: source,
      candidates: prioritizeMovieCandidates([...myWatchlist, ...otherWatchlist]),
      sourceLabel: `Tu watchlist + @${selectedUser.username}`,
      emptyTitle: 'Las dos watchlists estan vacias.',
      emptyBody: 'Cuando una de las dos tenga peliculas o series guardadas, podras sacar una sugerencia random conjunta.',
      notice: null,
    };
  } catch (error) {
    if (isUnauthorizedLike(error)) {
      return { kind: 'unauthorized' };
    }
    throw error;
  }
}

export function pickRandomCandidate(
  items: SavedMediaStatus[],
  random: () => number = Math.random,
): SavedMediaStatus | null {
  if (items.length === 0) {
    return null;
  }

  const index = Math.floor(random() * items.length);
  return items[index] ?? null;
}

export function toRandomPickListOptions(lists: ListSummary[]): RandomPickListOption[] {
  return lists.map((item) => ({
    id: item.id,
    name: item.name,
    items_count: item.items_count,
    relationship: item.relationship,
    owner_username: item.owner.username,
  }));
}

export function toSavedStatusesFromList(
  items: Array<{ tmdb_id: number; media_type: 'movie' | 'tv' }>,
): SavedMediaStatus[] {
  return items.map((item) => ({
    tmdb_id: item.tmdb_id,
    media_type: item.media_type,
    status: 'watchlist',
  }));
}

function prioritizeMovieCandidates(items: SavedMediaStatus[]): SavedMediaStatus[] {
  const movieItems = items.filter((item) => item.media_type === 'movie');
  return movieItems.length > 0 ? movieItems : items;
}

function isUnauthorizedLike(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeResponse = 'response' in error ? (error as { response?: { status?: number } }).response : undefined;
  return maybeResponse?.status === 401;
}
