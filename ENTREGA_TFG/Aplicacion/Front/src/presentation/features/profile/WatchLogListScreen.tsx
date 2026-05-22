import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { sharedStyles } from '../../theme/sharedStyles';
import { useWatchLogListViewModel } from './WatchLogListViewModel';
import { WatchLogDiaryContent } from './WatchLogDiaryContent';
import { DiaryRenderableItem } from './watchLogDiarySections';

export default function WatchLogListScreen() {
  const { items, loading, deletingId, error, removeItem } = useWatchLogListViewModel();

  function openDiaryDetail(item: DiaryRenderableItem) {
    router.push({
      pathname: '/detail',
      params: {
        media_type: item.media_type,
        tmdb_id: String(item.tmdb_id),
      },
    });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <WatchLogDiaryContent
        items={items}
        loading={loading}
        deletingId={deletingId}
        error={error}
        onOpenDetail={openDiaryDetail}
        onDelete={removeItem}
        eyebrow="Tu historial"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
});
