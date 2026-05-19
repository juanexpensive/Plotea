import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { ListInvitation, ListSummary } from '../../../domain/entities/lists';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { useMyListsViewModel } from './MyListsViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

const design = {
  emerald: '#3ecf8e',
  emeraldDeep: '#24b47e',
  canvasNight: '#171717',
  canvasNightSoft: '#1c1c1c',
  canvasNightRaised: '#202020',
  hairline: '#2a2a2a',
  hairlineStrong: '#353535',
  onDark: '#ffffff',
  onDarkMute: '#b2b2b2',
  onDarkSoft: '#8b8b8b',
  danger: '#ff6b57',
};

export default function MyListsScreen() {
  const [showComposer, setShowComposer] = useState(false);
  const {
    ownedLists,
    sharedLists,
    listPreviews,
    pendingInvitations,
    loading,
    saving,
    processingInvitationId,
    error,
    form,
    updateForm,
    submit,
    openList,
    respondToInvitation,
  } = useMyListsViewModel();

  const allLists = useMemo(
    () =>
      [...ownedLists, ...sharedLists].sort(
        (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
      ),
    [ownedLists, sharedLists],
  );

  async function handleSubmit() {
    const created = await submit();
    if (created) {
      setShowComposer(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <PlotStarLoader size="small" />
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {pendingInvitations.length > 0 ? (
          <View style={styles.section}>
            {pendingInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                busy={processingInvitationId === invitation.id}
                onAccept={() => void respondToInvitation(invitation.id, 'accept')}
                onDeny={() => void respondToInvitation(invitation.id, 'deny')}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          {allLists.length > 0 ? (
            allLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                posters={listPreviews[list.id] ?? []}
                onPress={() => openList(list.id)}
              />
            ))
          ) : (
            <EmptyPanel text="Todavia no tienes listas." />
          )}
        </View>
      </ScrollView>

      {showComposer ? (
        <>
          <Pressable style={styles.backdrop} onPress={() => setShowComposer(false)} />
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <Text style={styles.composerTitle}>Nueva lista</Text>
              <Pressable style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]} onPress={() => setShowComposer(false)}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(value) => updateForm({ name: value })}
              placeholder="Nombre de la lista"
              placeholderTextColor={design.onDarkSoft}
              selectionColor={design.emerald}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description ?? ''}
              onChangeText={(value) => updateForm({ description: value })}
              placeholder="Descripcion breve"
              placeholderTextColor={design.onDarkSoft}
              multiline
              selectionColor={design.emerald}
            />
            <View style={styles.composerFooter}>
              <View style={styles.toggleStack}>
                <Text style={styles.toggleLabel}>Lista publica</Text>
              </View>
              <Switch
                value={form.is_public}
                onValueChange={(value) => updateForm({ is_public: value })}
                trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
                thumbColor={form.is_public ? design.canvasNight : '#f6f6f6'}
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null, saving ? styles.disabled : null]}
              onPress={() => void handleSubmit()}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Creando...' : 'Crear lista'}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed ? styles.primaryButtonPressed : null]}
        onPress={() => setShowComposer(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function InvitationCard({
  invitation,
  busy,
  onAccept,
  onDeny,
}: {
  invitation: ListInvitation;
  busy: boolean;
  onAccept: () => void;
  onDeny: () => void;
}) {
  return (
    <View style={styles.invitationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{invitation.list_name}</Text>
        <Text style={styles.countLabel}>Invitacion</Text>
      </View>
      {invitation.list_description ? <Text style={styles.cardDescription}>{truncateDescription(invitation.list_description)}</Text> : null}
      <Text style={styles.metaText}>de @{invitation.owner.username}</Text>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.primaryButtonSmall, pressed ? styles.primaryButtonPressed : null, busy ? styles.disabled : null]}
          onPress={onAccept}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Procesando...' : 'Aceptar'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButtonSmall, pressed ? styles.pressed : null, busy ? styles.disabled : null]}
          onPress={onDeny}
          disabled={busy}
        >
          <Text style={styles.secondaryButtonText}>Denegar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ListCard({
  list,
  posters,
  onPress,
}: {
  list: ListSummary;
  posters: string[];
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.listCard, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{list.name}</Text>
        <Text style={styles.countLabel}>{formatCountLabel(list.items_count)}</Text>
      </View>
      <PosterStrip posters={posters} />
      <Text style={styles.cardDescription}>{truncateDescription(list.description)}</Text>
    </Pressable>
  );
}

function PosterStrip({ posters }: { posters: string[] }) {
  const cells = posters.slice(0, 3);

  return (
    <View style={styles.posterStrip}>
      {[0, 1, 2].map((index) => {
        const posterPath = cells[index] ?? null;

        return posterPath ? (
          <Image key={`${posterPath}-${index}`} source={{ uri: `${TMDB_IMAGE}${posterPath}` }} style={styles.posterTile} />
        ) : (
          <View key={`empty-${index}`} style={[styles.posterTile, styles.posterFallback]} />
        );
      })}
    </View>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function formatCountLabel(count: number) {
  return `${count} ${count === 1 ? 'film' : 'films'}`;
}

function truncateDescription(description: string | null | undefined) {
  if (!description?.trim()) {
    return ' ';
  }

  const firstParagraph = description.trim().split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim() ?? '';
  const maxLength = 110;

  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  return `${firstParagraph.slice(0, maxLength).trimEnd()}...`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: design.canvasNight,
  },
  scroll: {
    flex: 1,
    backgroundColor: design.canvasNight,
  },
  content: {
    paddingTop: 18,
    paddingBottom: 120,
  },
  section: {
    gap: 1,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    color: design.danger,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  invitationCard: {
    backgroundColor: design.canvasNightSoft,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: design.hairline,
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 14,
  },
  listCard: {
    backgroundColor: design.canvasNightSoft,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: design.hairline,
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardTitle: {
    flex: 1,
    color: design.onDark,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  countLabel: {
    color: design.onDarkMute,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
  },
  posterStrip: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 252,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    backgroundColor: design.canvasNightRaised,
  },
  posterTile: {
    flex: 1,
    height: '100%',
    backgroundColor: design.canvasNightRaised,
  },
  posterFallback: {
    borderRightWidth: 1,
    borderRightColor: design.hairline,
  },
  cardDescription: {
    color: design.onDarkMute,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 22,
  },
  metaText: {
    color: design.onDarkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 6,
    backgroundColor: design.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonSmall: {
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: design.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  primaryButtonPressed: {
    backgroundColor: design.emeraldDeep,
  },
  primaryButtonText: {
    color: design.canvasNight,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonSmall: {
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: design.canvasNightRaised,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  secondaryButtonText: {
    color: design.onDark,
    fontSize: 14,
    fontWeight: '500',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  composerCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 94,
    backgroundColor: design.canvasNightSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    padding: 18,
    gap: 14,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  composerTitle: {
    color: design.onDark,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
  },
  closeButton: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  closeButtonText: {
    color: design.onDarkSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    backgroundColor: design.canvasNightRaised,
    paddingHorizontal: 12,
    color: design.onDark,
    fontSize: 15,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleStack: {
    flex: 1,
  },
  toggleLabel: {
    color: design.onDark,
    fontSize: 15,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: design.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: {
    color: design.canvasNight,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '400',
    marginTop: -2,
  },
  emptyPanel: {
    backgroundColor: design.canvasNightSoft,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: design.hairline,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  emptyText: {
    color: design.onDarkMute,
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.55,
  },
});
