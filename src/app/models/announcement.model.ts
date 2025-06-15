export interface Announcement {
  tenant_id: string;
  _id: string;
  description: string;
  fileName: string;
  scheduledTime?: string;
  scheduleType: 'cyclic' | 'oneTime';
  selectedDays?: number[];
  selectedHours?: number[];
  selectedMinutes?: number[];
  cronSchedule?: string;
  countries?: string[]
}