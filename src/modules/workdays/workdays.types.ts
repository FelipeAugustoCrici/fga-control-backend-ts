import { TaskEntryResponse } from '../entries/entries.types';

// Réplica de model.WorkDay — sem omitempty.
export interface WorkDayResponse {
  date: string;
  status: 'worked' | 'not_worked';
  worked_hours: string;
  total_minutes: number;
  entries: TaskEntryResponse[];
}
