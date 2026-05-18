import { ScrollView, StyleSheet } from 'react-native';
import { sharedStyles } from '../../theme/sharedStyles';
import { useWatchLogListViewModel } from './WatchLogListViewModel';
import { WatchLogDiaryContent } from './WatchLogDiaryContent';

export default function WatchLogListScreen() {
  const { items, loading, deletingId, error, openDetail, removeItem } = useWatchLogListViewModel();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <WatchLogDiaryContent
        items={items}
        loading={loading}
        deletingId={deletingId}
        error={error}
        onOpenDetail={openDetail}
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
