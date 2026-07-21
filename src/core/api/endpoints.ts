import { request, publicRequest } from "./client";
import type {
  Meeting,
  MeetingListResponse,
  BotPlatform,
  BotStatus,
  User,
  UserRole,
  MeetingChapter,
  ActionItem,
  SentimentSummary,
  DiarizedTranscriptSegment,
  MomReport
} from "./types";

// Full port of web/src/lib/api.ts's endpoint surface. Same paths, same shapes.
// Transport differences (base URL, cookie read) live in client.ts.

// ── Calendar auto-join connections (Phase 2) ────────────────────────────────

export type CalendarProvider = "google" | "microsoft";

export interface CalendarConnection {
  provider: CalendarProvider;
  accountEmail?: string;
  accountName?: string;
  status: "connected" | "revoked" | "error";
  lastSyncedAt?: string;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarConnectionsResponse {
  connections: CalendarConnection[];
  available: Record<CalendarProvider, boolean>;
}

export function getCalendarConnections(): Promise<CalendarConnectionsResponse> {
  return request<CalendarConnectionsResponse>("/api/calendar/connections");
}

export function startCalendarConnect(provider: CalendarProvider): Promise<{ url: string }> {
  return request<{ url: string }>(`/api/calendar/${provider}/start`);
}

export function disconnectCalendar(provider: CalendarProvider): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/calendar/connections/${provider}`, { method: "DELETE" });
}

export interface UpcomingMeeting {
  id: string;
  source: CalendarProvider;
  title: string;
  startTime: string;
  endTime: string;
  joinUrl?: string;
  platform?: BotPlatform;
  organizer?: string;
  isAllDay: boolean;
  autoJoin: boolean;
}

export interface UpcomingMeetingsResponse {
  meetings: UpcomingMeeting[];
  connectionErrors: Array<{ provider: CalendarProvider; error: string }>;
}

export function getUpcomingMeetings(range?: { from: string; to: string }): Promise<UpcomingMeetingsResponse> {
  const suffix = range ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}` : "";
  return request<UpcomingMeetingsResponse>(`/api/calendar/events${suffix}`);
}

// ── Meetings ─────────────────────────────────────────────────────────────────

export interface ListMeetingsParams {
  page?: number;
  pageSize?: number;
  platform?: BotPlatform;
  status?: BotStatus;
  search?: string;
}

export function listMeetings(params: ListMeetingsParams = {}): Promise<MeetingListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.platform) query.set("platform", params.platform);
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<MeetingListResponse>(`/api/meetings${suffix}`);
}

export function getMeeting(sessionId: string): Promise<Meeting> {
  return request<Meeting>(`/api/meetings/${encodeURIComponent(sessionId)}`);
}

export function deleteMeeting(sessionId: string): Promise<{ ok: boolean; purged: boolean }> {
  return request<{ ok: boolean; purged: boolean }>(`/api/meetings/${encodeURIComponent(sessionId)}`, {
    method: "DELETE"
  });
}

export interface MeetingStats {
  total: number;
  recorded: number;
  positive: number;
  positiveShare: number | null;
  actionItems: number;
  avgActions: number | null;
}

export function getMeetingStats(): Promise<MeetingStats> {
  return request<MeetingStats>("/api/meetings/stats");
}

// ── Public share links ───────────────────────────────────────────────────────

export interface ShareLinkResponse {
  enabled: boolean;
  token: string | null;
  url: string | null;
}

export function createShareLink(sessionId: string): Promise<ShareLinkResponse> {
  return request<ShareLinkResponse>(`/api/meetings/${encodeURIComponent(sessionId)}/share`, {
    method: "POST"
  });
}

export function revokeShareLink(sessionId: string): Promise<{ enabled: boolean }> {
  return request<{ enabled: boolean }>(`/api/meetings/${encodeURIComponent(sessionId)}/share`, {
    method: "DELETE"
  });
}

export interface PublicMeeting {
  token: string;
  meetingName?: string;
  platform: BotPlatform;
  status: BotStatus;
  meetingLanguage?: string;
  transcriptionProvider?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
  participants: Array<{ name: string }>;
  summary: string;
  chapters: MeetingChapter[];
  actionItems: ActionItem[];
  sentimentSummary?: SentimentSummary;
  diarizedTranscript: DiarizedTranscriptSegment[];
  transcriptText: string;
  momReport?: MomReport;
  hasRecording: boolean;
  recordingUrl?: string;
  thumbnailUrl?: string;
}

export function getPublicMeeting(token: string): Promise<PublicMeeting> {
  return publicRequest<PublicMeeting>(`/api/public/meetings/${encodeURIComponent(token)}`);
}

// ── Insights ─────────────────────────────────────────────────────────────────

export type InsightRange = "7d" | "30d" | "90d" | "all";

export interface ActionItemInsights {
  total: number;
  done: number;
  open: number;
  completionRate: number;
  byPriority: { high: number; medium: number; low: number };
  byOwner: Array<{ owner: string; open: number; total: number }>;
  overdue: Array<{ task: string; owner: string; due: string; sessionId: string }>;
  overdueCount: number;
}

export interface ParticipationInsights {
  speakers: Array<{ name: string; talkSeconds: number; meetings: number; share: number }>;
  totalTalkSeconds: number;
}

export interface TopicsInsights {
  topics: Array<{ label: string; count: number; sessions: string[] }>;
}

export function getActionItemInsights(range: InsightRange = "30d"): Promise<ActionItemInsights> {
  return request<ActionItemInsights>(`/api/insights/action-items?range=${range}`);
}

export function getParticipation(range: InsightRange = "30d"): Promise<ParticipationInsights> {
  return request<ParticipationInsights>(`/api/insights/participation?range=${range}`);
}

export function getTopics(range: InsightRange = "30d"): Promise<TopicsInsights> {
  return request<TopicsInsights>(`/api/insights/topics?range=${range}`);
}

// ── Bot sessions (join a live meeting) ───────────────────────────────────────

export interface CreateBotSessionPayload {
  platform: BotPlatform;
  meetingUrl: string;
  meetingPasscode?: string;
  webhookUrl?: string;
}

export interface CreateBotSessionResponse {
  sessionId: string;
  status: BotStatus;
  attached?: boolean;
}

export function createBotSession(payload: CreateBotSessionPayload): Promise<CreateBotSessionResponse> {
  return request<CreateBotSessionResponse>("/bots", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

interface UserResponse {
  user: User;
}

export function signup(payload: SignupPayload): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function login(payload: LoginPayload): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function logout(): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/me");
}

export function updateMe(payload: UpdateProfilePayload): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function changePassword(payload: ChangePasswordPayload): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteAccount(password: string): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ password })
  });
}

// ── Admin (Phase 2) ──────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
  meetingCount: number;
  minutes: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  sort?: "createdAt" | "email" | "name";
  order?: "asc" | "desc";
}

export function adminListUsers(params: AdminUsersParams = {}): Promise<AdminUsersResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.search) q.set("search", params.search);
  if (params.role) q.set("role", params.role);
  if (params.sort) q.set("sort", params.sort);
  if (params.order) q.set("order", params.order);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return request<AdminUsersResponse>(`/api/admin/users${suffix}`);
}

export function adminSetUserRole(
  id: string,
  role: UserRole
): Promise<{ user: { id: string; email: string; role: UserRole } }> {
  return request<{ user: { id: string; email: string; role: UserRole } }>(
    `/api/admin/users/${encodeURIComponent(id)}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) }
  );
}

export interface AdminAnalyticsSummary {
  userCount: number;
  meetingCount: number;
  totalMinutes: number;
  activeWindowDays: number;
  activeUsers: number;
  activeByLogin: number;
}

export function adminGetAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  return request<AdminAnalyticsSummary>("/api/admin/analytics/summary");
}

export interface AdminTrendPoint {
  date: string;
  signups: number;
  meetings: number;
}

export interface AdminTrendsResponse {
  days: number;
  series: AdminTrendPoint[];
}

export function adminGetAnalyticsTrends(days = 30): Promise<AdminTrendsResponse> {
  return request<AdminTrendsResponse>(`/api/admin/analytics/trends?days=${days}`);
}

export interface AdminSetting {
  key: string;
  group: string;
  label: string;
  isSecret: boolean;
  type: "string" | "number" | "enum";
  options?: string[];
  help?: string;
  testable: boolean;
  isSet: boolean;
  source: "db" | "env";
  last4?: string;
  value?: string;
}

export type AdminSettingTestStatus = "ok" | "no_credits" | "unauthorized" | "error";

export interface AdminSettingTestResult {
  ok: boolean;
  status: AdminSettingTestStatus;
  detail: string;
}

export function adminTestSetting(key: string, value?: string): Promise<AdminSettingTestResult> {
  return request<AdminSettingTestResult>(`/api/admin/settings/${encodeURIComponent(key)}/test`, {
    method: "POST",
    body: JSON.stringify(value !== undefined ? { value } : {})
  });
}

export function adminGetSettings(): Promise<{ settings: AdminSetting[] }> {
  return request<{ settings: AdminSetting[] }>("/api/admin/settings");
}

export function adminUpdateSetting(key: string, value: string, password?: string): Promise<{ settings: AdminSetting[] }> {
  return request<{ settings: AdminSetting[] }>(`/api/admin/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value, password })
  });
}

export function adminRevertSetting(key: string): Promise<{ settings: AdminSetting[] }> {
  return request<{ settings: AdminSetting[] }>(`/api/admin/settings/${encodeURIComponent(key)}`, {
    method: "DELETE"
  });
}
