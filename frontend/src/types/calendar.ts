import { WorkoutType } from './workout';

export type EventSource = 'app' | 'google' | 'habit' | 'task' | 'goal' | 'workout';
export type SyncStatus = 'local' | 'synced' | 'sync_failed' | 'deleted' | 'sync_pending';

export type CalendarEventType = 'workout' | 'task' | 'habit' | 'goal' | 'custom';

export interface CalendarEventMetadata {
  workoutType?: WorkoutType;
  muscleGroups?: string[];
  duration?: number;
  [key: string]: any;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: CalendarEventType;
  metadata?: CalendarEventMetadata;
  color?: string;
  allDay?: boolean;
  source: EventSource;
  sourceId?: string;
  userId?: string;
  relatedId?: string;
  relatedType?: 'task' | 'goal' | 'habit' | 'workout';
  googleEventId?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceId?: string;
  location?: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  startDateTime: string; // Formato: "yyyy-MM-dd'T'HH:mm:ss"
  endDateTime: string; // Formato: "yyyy-MM-dd'T'HH:mm:ss"
  location?: string;
  isAllDay?: boolean;
  goalId?: string;
  taskId?: string;
  habitId?: string;
  workoutId?: string;
  recurrenceRule?: string;
  color?: string;
  reminderMinutes?: number[];
}

export interface CalendarSettings {
  userId: string;
  defaultView: 'day' | 'week' | 'month' | 'agenda';
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showWeekends: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
  showCompleted: boolean;
  autoSync: boolean;
  syncFrequencyMinutes: number;
}

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errorMessage?: string;
  details?: any;
}

export interface RecurrenceOptions {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  until?: Date;
  count?: number;
  byDay?: string[]; // ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // [1, 15]
  byMonth?: number[]; // [1, 6]
  excludeDates?: Date[];
}

export interface CalendarEventRelation {
  id: string;
  userId: string;
  googleEventId?: string;
  localEventId?: string;
  goalId?: string;
  taskId?: string;
  habitId?: string;
  workoutId?: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  syncStatus: SyncStatus;
  syncError?: string;
}

export interface CalendarSyncLog {
  id: string;
  userId: string;
  syncType: 'push' | 'pull' | 'manual' | 'auto';
  status: 'success' | 'partial' | 'failed';
  startedAt: string;
  completedAt?: string;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errorMessage?: string;
  errorDetails?: any;
}

export interface CalendarView {
  id: string;
  name: string;
  events: CalendarEvent[];
  color?: string;
  visible: boolean;
} 