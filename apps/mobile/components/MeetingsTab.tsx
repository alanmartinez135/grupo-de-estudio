import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import type { Attendance, Meeting, MeetingMode } from "@grupo-estudio/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { api, errorMessage } from "@/lib/api";

const MODES: { value: MeetingMode; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
];

export function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Convierte "DD-MM-AAAA" y "HH:MM" (hora local) a una fecha. null si el formato no es válido.
function parseLocalDateTime(date: string, time: string): Date | null {
  const d = date.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const t = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!d || !t) return null;
  const result = new Date(Number(d[3]), Number(d[2]) - 1, Number(d[1]), Number(t[1]), Number(t[2]));
  return result.getDate() === Number(d[1]) && Number(t[1]) < 24 && Number(t[2]) < 60 ? result : null;
}

// Pestaña "Encuentros" del detalle de grupo: coordinar sesiones de estudio entre integrantes.
export function MeetingsTab({ groupId }: { groupId: string }) {
  const userId = useAppStore((s) => s.authUser?.id);
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [mode, setMode] = useState<MeetingMode>("presencial");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.meetings
      .ofGroup(groupId)
      .then((m) => {
        setMeetings(m);
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  }, [groupId]);

  useEffect(load, [load]);

  function replace(updated: Meeting) {
    setMeetings((list) => (list ?? []).map((m) => (m.id === updated.id ? updated : m)));
  }

  async function respond(meetingId: string, response: Attendance) {
    try {
      replace(await api.meetings.respond(meetingId, response));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function cancel(meetingId: string) {
    try {
      await api.meetings.cancel(meetingId);
      setMeetings((list) => (list ?? []).filter((m) => m.id !== meetingId));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function handleCreate() {
    const startsAt = parseLocalDateTime(date, time);
    if (!startsAt) return setFormError("Usa el formato DD-MM-AAAA para la fecha y HH:MM para la hora.");
    setSaving(true);
    setFormError("");
    try {
      const created = await api.meetings.create(groupId, {
        topic,
        startsAt: startsAt.toISOString(),
        durationMinutes: Number(duration) || 0,
        mode,
        location,
      });
      setMeetings((list) => [...(list ?? []), created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setOpen(false);
      setTopic("");
      setDate("");
      setTime("");
      setLocation("");
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="gap-2.5">
      <Button label="+ Proponer encuentro" variant="outline" onPress={() => setOpen(true)} fullWidth />
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}

      {meetings === null ? (
        !error && <ActivityIndicator className="mt-4" />
      ) : meetings.length === 0 ? (
        <Card>
          <Text className="text-ink-muted dark:text-ink-mutedDark">
            No hay encuentros programados. Propón uno para estudiar juntos.
          </Text>
        </Card>
      ) : (
        meetings.map((m) => (
          <Card key={m.id}>
            <View className="flex-row items-start justify-between mb-1">
              <Text className="flex-1 pr-2 font-semibold text-ink-light dark:text-ink-dark">{m.topic}</Text>
              <Badge label={m.mode === "online" ? "Online" : "Presencial"} tone={m.mode === "online" ? "navy" : "gold"} />
            </View>
            <Text className="text-sm text-ink-light dark:text-ink-dark mb-0.5">
              {formatMeetingDate(m.startsAt)} · {m.durationMinutes} min
            </Text>
            {m.mode === "online" ? (
              <Pressable onPress={() => Linking.openURL(m.location)}>
                <Text className="text-sm text-navy-700 dark:text-gold-500 underline mb-2">{m.location}</Text>
              </Pressable>
            ) : (
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark mb-2">{m.location}</Text>
            )}
            <Text className="text-xs text-ink-muted dark:text-ink-mutedDark mb-3">
              {m.attendees.length === 0
                ? "Nadie ha confirmado todavía."
                : `Asistirán (${m.attendees.length}): ${m.attendees.map((a) => a.name).join(", ")}`}
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Asistiré"
                  size="sm"
                  variant={m.myResponse === "yes" ? "primary" : "outline"}
                  onPress={() => respond(m.id, "yes")}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  label="No asistiré"
                  size="sm"
                  variant={m.myResponse === "no" ? "primary" : "outline"}
                  onPress={() => respond(m.id, "no")}
                  fullWidth
                />
              </View>
            </View>
            {m.createdBy === userId && (
              <Pressable onPress={() => cancel(m.id)} className="mt-3 items-center">
                <Text className="text-xs font-semibold text-red-500">Cancelar encuentro</Text>
              </Pressable>
            )}
          </Card>
        ))
      )}

      <Modal visible={open} onClose={() => setOpen(false)} title="Proponer encuentro">
        <Input label="Tema" placeholder="Ej: Repaso de condicionales" value={topic} onChangeText={setTopic} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Fecha" placeholder="DD-MM-AAAA" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
          </View>
          <View className="flex-1">
            <Input label="Hora" placeholder="HH:MM" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <Input label="Duración (minutos)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <Text className="mb-1.5 text-sm font-medium text-ink-muted dark:text-ink-mutedDark">Modalidad</Text>
        <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1 mb-4">
          {MODES.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              className={`flex-1 rounded-full py-2 items-center ${mode === opt.value ? "bg-white dark:bg-navy-700" : ""}`}
            >
              <Text className={`font-semibold ${mode === opt.value ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          label={mode === "online" ? "Enlace de la reunión" : "Lugar"}
          placeholder={mode === "online" ? "https://meet.google.com/..." : "Ej: Biblioteca, sede San Joaquín"}
          autoCapitalize={mode === "online" ? "none" : "sentences"}
          value={location}
          onChangeText={setLocation}
        />
        {formError ? <Text className="text-xs text-red-500 mb-2">{formError}</Text> : null}
        <Button
          label="Proponer encuentro"
          onPress={handleCreate}
          loading={saving}
          disabled={!topic.trim() || !date.trim() || !time.trim() || !location.trim()}
          fullWidth
        />
      </Modal>
    </View>
  );
}
