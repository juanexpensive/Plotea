import { WatchLogEntryEnriched } from '../../../domain/entities/media';
import { WatchLogListItem } from './WatchLogListViewModel';

export type DiaryRenderableItem = WatchLogListItem | WatchLogEntryEnriched;

export type DiarySectionItem = DiaryRenderableItem & {
  dayNumber: string;
};

export type DiarySection = {
  key: string;
  title: string;
  items: DiarySectionItem[];
};

const MONTH_HEADER_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric',
});

function parseWatchDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function buildSectionKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getDiarySectionTitle(date: Date) {
  return MONTH_HEADER_FORMATTER.format(date).toUpperCase();
}

export function buildDiarySections(items: DiaryRenderableItem[]): DiarySection[] {
  const sortedItems = [...items].sort((left, right) => {
    const leftTime = parseWatchDate(left.watched_at).getTime();
    const rightTime = parseWatchDate(right.watched_at).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });

  const sections = new Map<string, DiarySection>();

  for (const item of sortedItems) {
    const watchedDate = parseWatchDate(item.watched_at);
    const sectionKey = buildSectionKey(watchedDate);
    const existingSection = sections.get(sectionKey);
    const sectionItem: DiarySectionItem = {
      ...item,
      dayNumber: String(watchedDate.getDate()),
    };

    if (existingSection) {
      existingSection.items.push(sectionItem);
      continue;
    }

    sections.set(sectionKey, {
      key: sectionKey,
      title: getDiarySectionTitle(watchedDate),
      items: [sectionItem],
    });
  }

  return Array.from(sections.values());
}

export function getReleaseYear(releaseDate: string | null | undefined) {
  return releaseDate ? releaseDate.slice(0, 4) : null;
}
