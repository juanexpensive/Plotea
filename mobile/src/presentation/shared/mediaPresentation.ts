import type { PersonalMediaStatus, ReviewRating } from '../../domain/entities/media';
import { uiCopy, getStatusLabel } from './uiCopy';

export function getMediaTypeLabel(mediaType: 'movie' | 'tv') {
  return uiCopy.mediaType[mediaType];
}

export function formatTmdbScore(value: number | null | undefined) {
  if (value === null || value === undefined || value <= 0) {
    return uiCopy.labels.noTmdbScore;
  }

  return `${value.toFixed(1)} / 10`;
}

export function formatUserScore(value: number | ReviewRating | null | undefined) {
  if (value === null || value === undefined) {
    return uiCopy.labels.unrated;
  }

  return `${Number(value).toFixed(1)} / 5`;
}

export function formatWatchLogScore(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return uiCopy.labels.unrated;
  }

  return `${(value / 2).toFixed(1)} / 5`;
}

export function formatReleaseYear(releaseDate: string | null | undefined) {
  return releaseDate ? releaseDate.slice(0, 4) : 'Proximamente';
}

export function formatMediaMetaLine({
  releaseDate,
  mediaType,
  voteAverage,
}: {
  releaseDate: string | null | undefined;
  mediaType: 'movie' | 'tv';
  voteAverage?: number | null;
}) {
  const parts = [formatReleaseYear(releaseDate), getMediaTypeLabel(mediaType)];

  if (voteAverage !== undefined) {
    parts.push(formatTmdbScore(voteAverage));
  }

  return parts.join(' | ');
}

export function formatFeaturedDescription(item: {
  media_type: 'movie' | 'tv';
  vote_average: number;
  release_date: string | null;
}) {
  const year = item.release_date ? ` | ${item.release_date.slice(0, 4)}` : '';
  return `${getMediaTypeLabel(item.media_type)} con nota ${formatTmdbScore(item.vote_average)}${year}`;
}

export function buildDetailMetaLine(releaseDate: string | null, runtime: number | null, average: number) {
  return [releaseDate ? releaseDate.slice(0, 4) : null, runtime ? `${runtime} min` : null, `${formatTmdbScore(average)} TMDB`]
    .filter(Boolean)
    .join(' | ');
}

export function buildDetailEyebrow(mediaType: 'movie' | 'tv', genres: string[]) {
  const mediaLabel = getMediaTypeLabel(mediaType).toUpperCase();
  if (genres.length === 0) {
    return mediaLabel;
  }

  return `${mediaLabel} | ${genres.slice(0, 3).join(' | ').toUpperCase()}`;
}

export function getDisplayStatusLabel(status: PersonalMediaStatus) {
  if (!status) {
    return null;
  }

  return getStatusLabel(status);
}
