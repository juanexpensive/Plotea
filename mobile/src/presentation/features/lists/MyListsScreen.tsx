import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useMyListsViewModel } from './MyListsViewModel';

const design = {
  emerald: '#3ecf8e',
  emeraldDeep: '#24b47e',
  ink: '#171717',
  inkMute: '#707070',
  canvas: '#ffffff',
  canvasSoft: '#fafafa',
  hairline: '#dfdfdf',
  hairlineStrong: '#c7c7c7',
  danger: '#ff2201',
};

export default function MyListsScreen() {
  const {
    ownedLists,
    sharedLists,
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LISTAS</Text>
      <Text style={styles.title}>Colecciones propias y conjuntas</Text>
      <Text style={styles.subtitle}>Crea una lista, comparte cine con gente de confianza y responde invitaciones desde aqui.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nueva lista</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(value) => updateForm({ name: value })}
          placeholder="Nombre de la lista"
          placeholderTextColor="#9a9a9a"
          selectionColor={design.emerald}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description ?? ''}
          onChangeText={(value) => updateForm({ description: value })}
          placeholder="Descripcion breve"
          placeholderTextColor="#9a9a9a"
          multiline
          selectionColor={design.emerald}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lista publica</Text>
          <Switch
            value={form.is_public}
            onValueChange={(value) => updateForm({ is_public: value })}
            trackColor={{ false: '#d4d4d4', true: '#4ade80' }}
            thumbColor={form.is_public ? design.ink : '#fff'}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : null, saving ? styles.disabled : null]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Creando...' : 'Crear lista'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={design.emerald} />
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Section title="Invitaciones" emptyText="No tienes invitaciones pendientes.">
        {pendingInvitations.map((invitation) => (
          <View key={invitation.id} style={styles.invitationCard}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>{invitation.list_name}</Text>
              <StatusPill label="Pendiente" tone="green" />
            </View>
            <Text style={styles.rowMeta}>de @{invitation.owner.username}</Text>
            {invitation.list_description ? <Text style={styles.rowDescription}>{invitation.list_description}</Text> : null}
            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [styles.primaryButtonSmall, pressed ? styles.primaryButtonPressed : null, processingInvitationId === invitation.id ? styles.disabled : null]}
                onPress={() => void respondToInvitation(invitation.id, 'accept')}
                disabled={processingInvitationId === invitation.id}
              >
                <Text style={styles.primaryButtonText}>{processingInvitationId === invitation.id ? 'Procesando...' : 'Aceptar'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButtonSmall, pressed ? styles.pressed : null, processingInvitationId === invitation.id ? styles.disabled : null]}
                onPress={() => void respondToInvitation(invitation.id, 'deny')}
                disabled={processingInvitationId === invitation.id}
              >
                <Text style={styles.secondaryButtonText}>Denegar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Section>

      <Section title="Mis listas" emptyText="Aun no has creado ninguna lista.">
        {ownedLists.map((list) => (
          <ListRow key={list.id} title={list.name} meta={`${list.items_count} ${list.items_count === 1 ? 'obra' : 'obras'} · ${list.is_public ? 'Publica' : 'Privada'}`} pillLabel="Owner" onPress={() => openList(list.id)} />
        ))}
      </Section>

      <Section title="Compartidas conmigo" emptyText="Cuando aceptes una invitacion, aparecera aqui.">
        {sharedLists.map((list) => (
          <ListRow key={list.id} title={list.name} meta={`${list.items_count} ${list.items_count === 1 ? 'obra' : 'obras'} · por @${list.owner.username}`} pillLabel="Compartida" onPress={() => openList(list.id)} />
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: ReactNode;
}) {
  const content = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasContent = Array.isArray(content) ? content.length > 0 : Boolean(content);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasContent ? content : <Text style={styles.emptyText}>{emptyText}</Text>}
    </View>
  );
}

function ListRow({
  title,
  meta,
  pillLabel,
  onPress,
}: {
  title: string;
  meta: string;
  pillLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>{title}</Text>
          <StatusPill label={pillLabel} tone="soft" />
        </View>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Text style={styles.rowAction}>Abrir</Text>
    </Pressable>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'soft' }) {
  return (
    <View style={tone === 'green' ? styles.greenPill : styles.softPill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  eyebrow: {
    color: design.inkMute,
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  title: {
    color: design.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: design.inkMute,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    color: design.ink,
    fontSize: 18,
    fontWeight: '500',
  },
  input: {
    minHeight: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    backgroundColor: design.canvas,
    paddingHorizontal: 12,
    color: design.ink,
    fontSize: 15,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: design.ink,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 42,
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
    color: design.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonSmall: {
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: design.canvas,
    borderWidth: 1,
    borderColor: design.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  secondaryButtonText: {
    color: design.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  errorText: {
    color: design.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: design.ink,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  emptyText: {
    color: design.inkMute,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: design.canvasSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 16,
  },
  invitationCard: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 16,
    gap: 10,
  },
  listRow: {
    backgroundColor: design.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.hairline,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    color: design.ink,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  rowMeta: {
    color: design.inkMute,
    fontSize: 13,
    lineHeight: 18,
  },
  rowDescription: {
    color: design.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  rowAction: {
    color: design.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  greenPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: design.emerald,
  },
  softPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: design.canvasSoft,
    borderWidth: 1,
    borderColor: design.hairline,
  },
  pillText: {
    color: design.ink,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
