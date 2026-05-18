import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PublicUserSummary } from '../../../domain/entities/social';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { ProfileNetworkTab, useProfileNetworkViewModel } from './ProfileNetworkViewModel';

export default function ProfileNetworkScreen() {
  const { tab, username, display_name } = useLocalSearchParams<{
    tab?: string;
    username?: string;
    display_name?: string;
  }>();
  const { activeTab, followers, following, loading, error, pendingUserId, setActiveTab, toggleFollow, openProfile } =
    useProfileNetworkViewModel(tab);

  const titleOwner = display_name || username || 'Tu';
  const title = `${titleOwner}'s Network`;
  const list = activeTab === 'followers' ? followers : following;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={darkDesign.colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.tabs}>
        <NetworkTabButton
          label="Following"
          active={activeTab === 'following'}
          onPress={() => setActiveTab('following')}
        />
        <NetworkTabButton
          label="Followers"
          active={activeTab === 'followers'}
          onPress={() => setActiveTab('followers')}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={darkDesign.colors.accent} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!error && list.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeTab === 'followers'
                ? 'Todavia no tienes seguidores.'
                : 'Todavia no sigues a nadie.'}
            </Text>
          ) : null}
          {list.map((user) => (
            <NetworkRow
              key={`${activeTab}-${user.id}`}
              user={user}
              disabled={pendingUserId === user.id}
              onPress={() => openProfile(user.username)}
              onToggleFollow={() => toggleFollow(user)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function NetworkTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Text style={active ? styles.tabLabelActive : styles.tabLabel}>{label}</Text>
      <View style={active ? styles.tabIndicatorActive : styles.tabIndicator} />
    </Pressable>
  );
}

function NetworkRow({
  user,
  disabled,
  onPress,
  onToggleFollow,
}: {
  user: PublicUserSummary;
  disabled: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
}) {
  const label = user.display_name ?? user.username;

  return (
    <View style={styles.row}>
      <Pressable style={({ pressed }) => [styles.rowMain, pressed ? styles.pressed : null]} onPress={onPress}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{label.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{label}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>@{user.username}</Text>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          user.is_following ? styles.followButtonActive : styles.followButton,
          pressed ? styles.pressed : null,
          disabled ? styles.disabled : null,
        ]}
        onPress={onToggleFollow}
        disabled={disabled}
      >
        <Ionicons
          name={user.is_following ? 'checkmark' : 'add'}
          size={28}
          color={user.is_following ? darkDesign.colors.onAccent : darkDesign.colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050607',
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: darkDesign.spacing.xl,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: darkDesign.colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    paddingTop: darkDesign.spacing.sm,
  },
  tabLabel: {
    color: darkDesign.colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: darkDesign.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    width: '100%',
    height: 4,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    width: '100%',
    height: 4,
    backgroundColor: darkDesign.colors.accent,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: darkDesign.spacing.huge,
  },
  row: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
    backgroundColor: darkDesign.colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.lg,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: darkDesign.colors.textSoft,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  rowMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  followButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b6bec9',
    marginRight: darkDesign.spacing.xs,
  },
  followButtonActive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.accent,
    marginRight: darkDesign.spacing.xs,
  },
  emptyText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingTop: darkDesign.spacing.xxl,
  },
  errorText: {
    ...sharedStyles.errorText,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingTop: darkDesign.spacing.lg,
  },
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
