import { Pressable, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../theme/darkDesign';
import { uiCopy } from './uiCopy';

type SummaryStats = {
  watchedCount: number;
  followingCount: number;
  followersCount: number;
};

export function ProfileSummaryStatsBar({
  stats,
  onOpenFollowing,
  onOpenFollowers,
}: {
  stats: SummaryStats;
  onOpenFollowing?: () => void;
  onOpenFollowers?: () => void;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <SummaryStatItem value={stats.watchedCount} label={uiCopy.stats.watched} />
        <SummaryStatItem value={stats.followingCount} label={uiCopy.stats.following} onPress={onOpenFollowing} />
        <SummaryStatItem value={stats.followersCount} label={uiCopy.stats.followers} onPress={onOpenFollowers} />
      </View>
    </View>
  );
}

function SummaryStatItem({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.item}>{content}</View>;
  }

  return (
    <Pressable style={styles.item} onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: darkDesign.spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    color: darkDesign.colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  label: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
