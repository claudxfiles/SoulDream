import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  getEventById: (eventId: string) => CalendarEvent | undefined;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      
      addEvent: (event) => {
        set((state) => ({
          events: [...state.events, event]
        }));
      },
      
      updateEvent: (eventId, updatedEvent) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId ? { ...event, ...updatedEvent } : event
          )
        }));
      },
      
      deleteEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId)
        }));
      },
      
      getEventById: (eventId) => {
        return get().events.find((event) => event.id === eventId);
      }
    }),
    {
      name: 'calendar-storage'
    }
  )
); 