import type {
  AdminOverview,
  AdminProfile,
  AdminSession,
  AdminSettings,
  AdminSettingsUpdate,
  Announcement,
  AnnouncementInput,
  AnnouncementPage,
  AnnouncementUpdate,
  DailyMessage,
  DailyMessageInput,
  Journey,
  JourneyDetail,
  JourneyDay,
  JourneyDayInput,
  JourneyInput,
  JourneySource,
  JourneySourceInput,
  SubscribeInput,
  Subscriber,
  SubscriberPage,
} from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://dailybread-backend.onrender.com").replace(/\/$/, "");

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    let detail = response.statusText || "Request failed";
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // Keep the HTTP status text when the response is not JSON.
    }
    throw new ApiRequestError(detail, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function subscribe(input: SubscribeInput): Promise<Subscriber> {
  return request<Subscriber>("/subscribe", { method: "POST", body: JSON.stringify(input) });
}

export function loginAdmin(email: string, password: string): Promise<AdminSession> {
  return request<AdminSession>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function getAdminProfile(token: string): Promise<AdminProfile> {
  return request<AdminProfile>("/admin/auth/me", {}, token);
}

export function logoutAdmin(token: string): Promise<void> {
  return request<void>("/admin/auth/logout", { method: "POST" }, token);
}

export function getOverview(token: string): Promise<AdminOverview> {
  return request<AdminOverview>("/admin/overview", {}, token);
}

export function getSubscribers(token: string, page = 1, pageSize = 25, search = ""): Promise<SubscriberPage> {
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search.trim()) query.set("search", search.trim());
  return request<SubscriberPage>(`/admin/overview/subscribers?${query.toString()}`, {}, token);
}

export function deleteSubscriber(token: string, id: string): Promise<void> {
  return request<void>(`/admin/overview/subscribers/${id}`, { method: "DELETE" }, token);
}

export function getMessages(token: string, status?: string): Promise<DailyMessage[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<DailyMessage[]>(`/admin/daily-messages${query}`, {}, token);
}

export function createMessage(token: string, input: DailyMessageInput): Promise<DailyMessage> {
  return request<DailyMessage>("/admin/daily-messages", { method: "POST", body: JSON.stringify(input) }, token);
}

export function generateMessage(token: string, messageDate: string): Promise<DailyMessage> {
  return request<DailyMessage>(`/admin/daily-messages/generate-ai?message_date=${encodeURIComponent(messageDate)}`, { method: "POST" }, token);
}

export function updateMessage(token: string, id: string, input: Partial<DailyMessageInput>): Promise<DailyMessage> {
  return request<DailyMessage>(`/admin/daily-messages/${id}`, { method: "PUT", body: JSON.stringify(input) }, token);
}

export function messageAction(token: string, id: string, action: "submit" | "approve" | "unapprove" | "archive"): Promise<DailyMessage> {
  return request<DailyMessage>(`/admin/daily-messages/${id}/${action}`, { method: "POST" }, token);
}

export function deleteMessage(token: string, id: string): Promise<void> {
  return request<void>(`/admin/daily-messages/${id}`, { method: "DELETE" }, token);
}

export function getJourneys(token: string): Promise<Journey[]> {
  return request<Journey[]>("/admin/journeys", {}, token);
}

export function getJourney(token: string, id: string): Promise<JourneyDetail> {
  return request<JourneyDetail>(`/admin/journeys/${id}`, {}, token);
}

export function createJourney(token: string, input: JourneyInput): Promise<Journey> {
  return request<Journey>("/admin/journeys", { method: "POST", body: JSON.stringify(input) }, token);
}

export function generateJourney(token: string, input: { title: string; category?: string; duration_days: number; theme?: string }): Promise<JourneyDetail> {
  return request<JourneyDetail>("/admin/journeys/generate-ai", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateJourney(token: string, id: string, input: Partial<JourneyInput>): Promise<Journey> {
  return request<Journey>(`/admin/journeys/${id}`, { method: "PUT", body: JSON.stringify(input) }, token);
}

export function journeyAction(token: string, id: string, action: "publish" | "archive"): Promise<Journey> {
  return request<Journey>(`/admin/journeys/${id}/${action}`, { method: "POST" }, token);
}

export function deleteJourney(token: string, id: string): Promise<void> {
  return request<void>(`/admin/journeys/${id}`, { method: "DELETE" }, token);
}

export function addJourneyDay(token: string, journeyId: string, input: JourneyDayInput): Promise<JourneyDay> {
  return request<JourneyDay>(`/admin/journeys/${journeyId}/days`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateJourneyDay(token: string, journeyId: string, dayNumber: number, input: Partial<JourneyDayInput>): Promise<JourneyDay> {
  return request<JourneyDay>(`/admin/journeys/${journeyId}/days/${dayNumber}`, { method: "PUT", body: JSON.stringify(input) }, token);
}

export function deleteJourneyDay(token: string, journeyId: string, dayNumber: number): Promise<void> {
  return request<void>(`/admin/journeys/${journeyId}/days/${dayNumber}`, { method: "DELETE" }, token);
}

export function addJourneySource(token: string, journeyId: string, input: JourneySourceInput): Promise<JourneySource> {
  return request<JourneySource>(`/admin/journeys/${journeyId}/sources`, { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateJourneySource(token: string, journeyId: string, sourceId: string, input: Partial<JourneySourceInput>): Promise<JourneySource> {
  return request<JourneySource>(`/admin/journeys/${journeyId}/sources/${sourceId}`, { method: "PUT", body: JSON.stringify(input) }, token);
}

export function deleteJourneySource(token: string, journeyId: string, sourceId: string): Promise<void> {
  return request<void>(`/admin/journeys/${journeyId}/sources/${sourceId}`, { method: "DELETE" }, token);
}

export function getAnnouncements(token: string, page = 1, pageSize = 25, search = ""): Promise<AnnouncementPage> {
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search.trim()) query.set("search", search.trim());
  return request<AnnouncementPage>(`/admin/announcements?${query.toString()}`, {}, token);
}

export function getAnnouncement(token: string, id: string): Promise<Announcement> {
  return request<Announcement>(`/admin/announcements/${id}`, {}, token);
}

export function createAnnouncement(token: string, input: AnnouncementInput): Promise<Announcement> {
  return request<Announcement>("/admin/announcements", { method: "POST", body: JSON.stringify(input) }, token);
}

export function updateAnnouncement(token: string, id: string, input: AnnouncementUpdate): Promise<Announcement> {
  return request<Announcement>(`/admin/announcements/${id}`, { method: "PUT", body: JSON.stringify(input) }, token);
}

export function sendAnnouncement(token: string, id: string): Promise<Announcement> {
  return request<Announcement>(`/admin/announcements/${id}/send`, { method: "POST" }, token);
}

export function deleteAnnouncement(token: string, id: string): Promise<void> {
  return request<void>(`/admin/announcements/${id}`, { method: "DELETE" }, token);
}

export function getSettings(token: string): Promise<AdminSettings> {
  return request<AdminSettings>("/admin/settings", {}, token);
}

export function updateSettings(token: string, input: AdminSettingsUpdate): Promise<AdminSettings> {
  return request<AdminSettings>("/admin/settings", { method: "PUT", body: JSON.stringify(input) }, token);
}
