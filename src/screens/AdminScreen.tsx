import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, TextInput, View } from "react-native";
import {
  adminGetAnalyticsSummary,
  adminGetAnalyticsTrends,
  adminGetSettings,
  adminListUsers,
  adminRevertSetting,
  adminSetUserPassword,
  adminSetUserRole,
  adminTestSetting,
  adminUpdateSetting,
  type AdminSetting,
  type AdminSettingTestResult,
  type AdminUser
} from "../core/api/endpoints";
import type { UserRole } from "../core/api/types";
import { useAuthStore } from "../core/store/authStore";
import { useTheme } from "../core/theme/ThemeProvider";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { ErrorRetry } from "../ui/ErrorRetry";
import { Icon, type IconName } from "../ui/Icon";
import { PasswordInput } from "../ui/PasswordInput";
import { Screen } from "../ui/Screen";
import { Segmented } from "../ui/Segmented";
import { Sheet } from "../ui/Sheet";
import { Skeleton } from "../ui/Skeleton";
import { Sparkline } from "../ui/charts/Sparkline";
import { Text } from "../ui/Text";
import { PasswordRequirements } from "../features/auth/PasswordRequirements";

type AdminTab = "analytics" | "users" | "settings";

const TITLES: Record<AdminTab, string> = { analytics: "Analytics", users: "Users", settings: "Settings" };

export function AdminScreen() {
  const [view, setView] = useState<AdminTab>("analytics");
  return (
    <Screen scroll contentStyle={{ gap: 16 }}>
      <View>
        <Text variant="caption" tone="mute" style={{ letterSpacing: 2 }}>
          ADMIN
        </Text>
        <Text variant="title" style={{ marginTop: 4 }}>
          {TITLES[view]}
        </Text>
      </View>

      <Segmented<AdminTab>
        value={view}
        onChange={setView}
        options={[
          { value: "analytics", label: "Analytics" },
          { value: "users", label: "Users" },
          { value: "settings", label: "Settings" }
        ]}
      />

      {view === "analytics" ? <AnalyticsView /> : view === "users" ? <UsersView /> : <SettingsView />}
    </Screen>
  );
}

// ── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsView() {
  const { theme } = useTheme();
  const chartW = Dimensions.get("window").width - 48 - 40;

  const summary = useQuery({ queryKey: ["admin", "summary"], queryFn: adminGetAnalyticsSummary });
  const trends = useQuery({ queryKey: ["admin", "trends"], queryFn: () => adminGetAnalyticsTrends(30) });

  if (summary.isError) {
    return <ErrorRetry title="Couldn't load analytics." onRetry={summary.refetch} retrying={summary.isRefetching} />;
  }

  const s = summary.data;
  const kpis: { label: string; value: number; icon: IconName; accent: string; hint?: string }[] = s
    ? [
        { label: "Total users", value: s.userCount, icon: "Users", accent: theme.color.accent },
        { label: "Total meetings", value: s.meetingCount, icon: "Meetings", accent: theme.color.accentDeep },
        { label: "Minutes transcribed", value: s.totalMinutes, icon: "Clock", accent: theme.color.success },
        { label: `Active · ${s.activeWindowDays}d`, value: s.activeUsers, icon: "Bolt", accent: theme.color.warning, hint: "Owns a meeting in window" },
        { label: `Logged in · ${s.activeWindowDays}d`, value: s.activeByLogin, icon: "User", accent: theme.color.accent }
      ]
    : [];

  const series = trends.data?.series ?? [];

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.grid}>
        {!s
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} style={{ flexGrow: 1, flexBasis: "46%" }} />)
          : kpis.map((k) => (
              <Card key={k.label} style={{ flexGrow: 1, flexBasis: "46%" }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: k.accent + "1A",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12
                  }}
                >
                  <Icon name={k.icon} size={16} color={k.accent} />
                </View>
                <Text variant="caption" tone="mute">
                  {k.label}
                </Text>
                <Text style={{ fontSize: 26, fontWeight: "700", color: theme.color.ink, fontVariant: ["tabular-nums"], marginTop: 4 }}>
                  {k.value.toLocaleString()}
                </Text>
                {k.hint ? (
                  <Text variant="caption" tone="faint" style={{ marginTop: 4 }}>
                    {k.hint}
                  </Text>
                ) : null}
              </Card>
            ))}
      </View>

      <TrendCard title="Signups" subtitle="New accounts per day" values={series.map((t) => t.signups)} color={theme.color.accent} width={chartW} loading={trends.isLoading} />
      <TrendCard title="Meetings" subtitle="Recorded per day" values={series.map((t) => t.meetings)} color={theme.color.accentDeep} width={chartW} loading={trends.isLoading} />
    </View>
  );
}

function TrendCard({ title, subtitle, values, color, width, loading }: { title: string; subtitle: string; values: number[]; color: string; width: number; loading: boolean }) {
  const { theme } = useTheme();
  const total = values.reduce((n, v) => n + v, 0);
  const peak = values.length ? Math.max(...values) : 0;
  const avg = values.length ? Math.round((total / values.length) * 10) / 10 : 0;
  const hasData = values.some((v) => v > 0);
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
          <View>
            <Text variant="heading" style={{ fontSize: 15 }}>
              {title}
            </Text>
            <Text variant="caption" tone="mute" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: theme.color.ink, fontVariant: ["tabular-nums"] }}>{total}</Text>
          <Text variant="caption" tone="faint" style={{ marginTop: 2 }}>
            LAST 30 DAYS
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16, minHeight: 90, justifyContent: "flex-end" }}>
        {loading ? (
          <Skeleton height={72} />
        ) : hasData ? (
          <Sparkline values={values} width={width} height={88} stroke={color} fillId={`admin-${title}`} />
        ) : (
          <Text variant="caption" tone="faint" style={{ textAlign: "center", paddingVertical: 30 }}>
            No activity in this period
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.color.line }}>
        <TrendStat label="Peak / day" value={peak} color={color} />
        <TrendStat label="Avg / day" value={avg} color={color} />
      </View>
    </Card>
  );
}

function TrendStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View>
      <Text variant="caption" tone="faint">
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color, fontVariant: ["tabular-nums"], marginTop: 2 }}>{value}</Text>
    </View>
  );
}

// ── Users ────────────────────────────────────────────────────────────────────

function UsersView() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const me = useAuthStore((st) => st.user);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ user: AdminUser; next: UserRole } | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const users = useQuery({
    queryKey: ["admin", "users", { page, search, role }],
    queryFn: () => adminListUsers({ page, pageSize: 20, search: search || undefined, role: role || undefined })
  });

  const setRoleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: UserRole }) => adminSetUserRole(id, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirm(null);
    }
  });

  const input = {
    height: 44,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingLeft: 40,
    paddingRight: 14,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  const items = users.data?.items ?? [];

  return (
    <View style={{ gap: 14 }}>
      <View>
        <View style={{ position: "absolute", left: 12, top: 13, zIndex: 1 }}>
          <Icon name="Search" size={18} color={theme.color.inkFaint} />
        </View>
        <TextInput value={searchInput} onChangeText={setSearchInput} placeholder="Search by name or email…" placeholderTextColor={theme.color.inkFaint} autoCapitalize="none" style={input} />
      </View>

      <Segmented<UserRole | "">
        value={role}
        onChange={(r) => {
          setPage(1);
          setRole(r);
        }}
        options={[
          { value: "", label: "All" },
          { value: "user", label: "Users" },
          { value: "admin", label: "Admins" }
        ]}
      />

      {users.isError ? (
        <ErrorRetry title="Couldn't load users." onRetry={users.refetch} retrying={users.isRefetching} />
      ) : users.isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
            </Card>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState icon="Users" title="No users found" description="Try a different search or filter." />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((u) => {
            const fullName = `${u.firstName} ${u.lastName}`.trim() || u.email;
            const isSelf = me?.id === u.id;
            const isAdmin = u.role === "admin";
            return (
              <Card key={u.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={fullName} size={40} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text variant="body" numberOfLines={1} style={{ fontWeight: "600" }}>
                        {fullName}
                        {isSelf ? "  (you)" : ""}
                      </Text>
                      <Badge label={isAdmin ? "Admin" : "User"} tone={isAdmin ? "brand" : "neutral"} />
                    </View>
                    <Text variant="caption" tone="mute" numberOfLines={1}>
                      {u.email}
                    </Text>
                    <Text variant="caption" tone="faint" style={{ marginTop: 4 }}>
                      {u.meetingCount} meeting{u.meetingCount === 1 ? "" : "s"} · {u.minutes} min
                    </Text>
                  </View>
                </View>
                {!isSelf ? (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <Button
                      title={isAdmin ? "Demote" : "Make admin"}
                      variant={isAdmin ? "ghost" : "secondary"}
                      onPress={() => setConfirm({ user: u, next: isAdmin ? "user" : "admin" })}
                      style={{ flex: 1, height: 40 }}
                    />
                    <Button title="Reset password" variant="secondary" onPress={() => setResetUser(u)} style={{ flex: 1, height: 40 }} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      {/* Pagination */}
      {items.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <Text variant="caption" tone="mute">
            {users.data?.total ?? 0} user{(users.data?.total ?? 0) === 1 ? "" : "s"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button title="Prev" variant="secondary" disabled={page <= 1 || users.isFetching} onPress={() => setPage((p) => Math.max(1, p - 1))} style={{ height: 38, paddingHorizontal: 14 }} />
            <Text variant="caption" tone="mute" style={{ fontVariant: ["tabular-nums"] }}>
              Page {page}
            </Text>
            <Button title="Next" variant="secondary" disabled={!users.data?.hasMore || users.isFetching} onPress={() => setPage((p) => p + 1)} style={{ height: 38, paddingHorizontal: 14 }} />
          </View>
        </View>
      ) : null}

      <ConfirmModal
        visible={!!confirm}
        title={confirm?.next === "admin" ? "Make admin?" : "Demote to user?"}
        message={
          confirm
            ? `${`${confirm.user.firstName} ${confirm.user.lastName}`.trim() || confirm.user.email} will ${confirm.next === "admin" ? "gain full admin access" : "lose admin access"}.`
            : ""
        }
        confirmLabel={confirm?.next === "admin" ? "Make admin" : "Demote"}
        destructive={confirm?.next === "user"}
        loading={setRoleMut.isPending}
        onConfirm={() => confirm && setRoleMut.mutate({ id: confirm.user.id, next: confirm.next })}
        onCancel={() => setConfirm(null)}
      />

      <ResetPasswordSheet user={resetUser} onClose={() => setResetUser(null)} />
    </View>
  );
}

// Bottom sheet: an admin types a new strong password for a locked-out user.
// No email is sent — the admin shares the password out-of-band.
function ResetPasswordSheet({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset local state whenever a different user is opened.
  useEffect(() => {
    setValue("");
    setError(null);
    setDone(false);
    setBusy(false);
  }, [user?.id]);

  const strong = useMemo(
    () => value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value),
    [value]
  );

  async function submit() {
    if (!user || !strong) return;
    setBusy(true);
    setError(null);
    try {
      await adminSetUserPassword(user.id, value);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^\d+ [^—]*— ?/, "") : "Couldn't reset the password.");
    } finally {
      setBusy(false);
    }
  }

  const name = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "";

  return (
    <Sheet visible={!!user} onClose={onClose} eyebrow="Admin" title="Reset password">
      {done ? (
        <View style={{ gap: 12 }}>
          <Text variant="body" tone="soft" style={{ lineHeight: 22 }}>
            Password updated for <Text style={{ fontWeight: "700" }}>{name}</Text>. Share the new password with them
            securely — they can sign in with it right away.
          </Text>
          <Button title="Done" onPress={onClose} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text variant="body" tone="mute" style={{ lineHeight: 22 }}>
            Set a new password for <Text style={{ fontWeight: "700" }}>{name}</Text>. No email is sent — you'll need to
            share it with them.
          </Text>
          <PasswordInput value={value} onChangeText={setValue} placeholder="New password" autoCapitalize="none" />
          <PasswordRequirements value={value} />
          {error ? (
            <Text tone="danger" variant="label">
              {error}
            </Text>
          ) : null}
          <Button title="Reset password" onPress={submit} loading={busy} disabled={!strong} />
        </View>
      )}
    </Sheet>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

function SettingsView() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: adminGetSettings });
  const [local, setLocal] = useState<AdminSetting[] | null>(null);

  useEffect(() => {
    if (settings.data) setLocal(settings.data.settings);
  }, [settings.data]);

  const groups = useMemo(() => {
    const map = new Map<string, AdminSetting[]>();
    for (const s of local ?? []) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return [...map.entries()];
  }, [local]);

  if (settings.isError) {
    return <ErrorRetry title="Couldn't load settings." onRetry={settings.refetch} retrying={settings.isRefetching} />;
  }
  if (!local) {
    return (
      <View style={{ gap: 12 }}>
        {[0, 1].map((i) => (
          <Card key={i}>
            <Skeleton width="40%" height={14} />
            <Skeleton height={40} style={{ marginTop: 12 }} />
          </Card>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 20 }}>
      <Text variant="caption" tone="mute" style={{ lineHeight: 18 }}>
        Provider API keys and bot behaviour. Changes apply to the next meeting — no restart needed.
      </Text>
      {groups.map(([group, items]) => (
        <View key={group} style={{ gap: 10 }}>
          <Text variant="caption" tone="mute" style={{ letterSpacing: 1.5, paddingHorizontal: 2 }}>
            {group.toUpperCase()}
          </Text>
          <View style={{ gap: 10 }}>
            {items.map((s) => (
              <SettingRow key={s.key} setting={s} onChange={setLocal} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const cleanErr = (e: unknown) => (e instanceof Error ? e.message.replace(/^\d+ [^—]*— ?/, "") : "Failed");

function SettingRow({ setting, onChange }: { setting: AdminSetting; onChange: (s: AdminSetting[]) => void }) {
  const { theme } = useTheme();
  const [value, setValue] = useState<string>(setting.isSecret ? "" : setting.value ?? "");
  const [password, setPassword] = useState("");
  const [editingSecret, setEditingSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AdminSettingTestResult | null>(null);
  const [confirmRevert, setConfirmRevert] = useState(false);

  async function runTest(candidate?: string) {
    setTesting(true);
    setTestResult(null);
    setErr(null);
    try {
      setTestResult(await adminTestSetting(setting.key, candidate));
    } catch (e) {
      setTestResult({ ok: false, status: "error", detail: cleanErr(e) });
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await adminUpdateSetting(setting.key, value, setting.isSecret ? password : undefined);
      onChange(r.settings);
      setMsg("Saved");
      setPassword("");
      if (setting.isSecret) {
        setValue("");
        setEditingSecret(false);
      }
    } catch (e) {
      setErr(cleanErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function revert() {
    setConfirmRevert(false);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await adminRevertSetting(setting.key);
      onChange(r.settings);
      setMsg("Reverted to default");
      setValue("");
      setEditingSecret(false);
    } catch (e) {
      setErr(cleanErr(e));
    } finally {
      setBusy(false);
    }
  }

  const input = {
    height: 44,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  const chip = (() => {
    if (!setting.testable || !setting.isSet) return null;
    if (testing && !testResult) return { label: "Checking…", tone: "neutral" as const };
    if (!testResult) return null;
    const map = {
      ok: { label: "Connected", tone: "positive" as const },
      no_credits: { label: "Out of credits", tone: "warn" as const },
      unauthorized: { label: "Key invalid", tone: "negative" as const },
      error: { label: "Check failed", tone: "neutral" as const }
    };
    return map[testResult.status] ?? map.error;
  })();

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Text variant="body" style={{ fontWeight: "600" }}>
          {setting.label}
        </Text>
        <Badge label={setting.source === "db" ? "Custom" : "Default"} tone={setting.source === "db" ? "brand" : "neutral"} />
        {chip ? <Badge label={chip.label} tone={chip.tone} /> : null}
      </View>
      <Text variant="caption" tone="faint" style={{ marginTop: 2, fontVariant: ["tabular-nums"] }}>
        {setting.key}
      </Text>
      {setting.help ? (
        <Text variant="caption" tone="mute" style={{ marginTop: 6, lineHeight: 17 }}>
          {setting.help}
        </Text>
      ) : null}

      <View style={{ marginTop: 12, gap: 10 }}>
        {setting.isSecret ? (
          <>
            <Text variant="caption" tone="mute">
              {setting.isSet ? `Set · ••••${setting.last4 ?? ""}` : "Not set"}
            </Text>
            {!editingSecret ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {setting.testable && setting.isSet ? (
                  <Button title={testing ? "Testing…" : "Test"} variant="ghost" disabled={testing} onPress={() => runTest()} style={{ height: 40 }} />
                ) : null}
                <Button title={setting.isSet ? "Replace key" : "Set key"} variant="secondary" onPress={() => setEditingSecret(true)} style={{ flex: 1, height: 40 }} />
              </View>
            ) : (
              <>
                <TextInput value={value} onChangeText={setValue} placeholder="New key value" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
                <TextInput value={password} onChangeText={setPassword} placeholder="Confirm your password" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => {
                      setEditingSecret(false);
                      setValue("");
                      setPassword("");
                      setErr(null);
                      setTestResult(null);
                    }}
                    style={{ height: 40 }}
                  />
                  {setting.testable ? (
                    <Button title={testing ? "Testing…" : "Test"} variant="secondary" disabled={testing || !value} onPress={() => runTest(value)} style={{ height: 40 }} />
                  ) : null}
                  <Button title={busy ? "Saving…" : "Save"} disabled={busy || !value || !password} onPress={save} style={{ flex: 1, height: 40 }} />
                </View>
              </>
            )}
          </>
        ) : setting.type === "enum" ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {setting.options?.map((o) => {
              const active = value === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => setValue(o)}
                  style={{
                    paddingHorizontal: 14,
                    height: 38,
                    justifyContent: "center",
                    borderRadius: theme.radii.pill,
                    backgroundColor: active ? theme.color.accent : theme.color.surfaceHi
                  }}
                >
                  <Text variant="label" style={{ color: active ? "#fff" : theme.color.inkMute }}>
                    {o}
                  </Text>
                </Pressable>
              );
            })}
            <Button title={busy ? "…" : "Save"} disabled={busy || value === setting.value} onPress={save} style={{ height: 38, paddingHorizontal: 16 }} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType={setting.type === "number" ? "numeric" : "default"}
              placeholderTextColor={theme.color.inkFaint}
              style={[input, { flex: 1 }]}
            />
            <Button title={busy ? "…" : "Save"} disabled={busy || value === (setting.value ?? "")} onPress={save} style={{ height: 44, paddingHorizontal: 16 }} />
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {setting.source === "db" ? (
            <Text variant="caption" tone="mute" onPress={() => setConfirmRevert(true)}>
              Revert to default
            </Text>
          ) : null}
          {msg ? (
            <Text variant="caption" style={{ color: theme.color.success }}>
              {msg}
            </Text>
          ) : null}
          {err ? (
            <Text variant="caption" tone="danger">
              {err}
            </Text>
          ) : null}
        </View>
      </View>

      <ConfirmModal
        visible={confirmRevert}
        title="Revert to default?"
        message={`"${setting.label}" will use the default (.env) value again.`}
        confirmLabel="Revert"
        destructive
        loading={busy}
        onConfirm={revert}
        onCancel={() => setConfirmRevert(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }
});
