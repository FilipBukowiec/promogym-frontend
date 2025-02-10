export interface Announcement {
    _id: string;
    description: string;
    fileName: string;
    scheduledTime?: string; 
    scheduleType: 'cyclic' | 'oneTime'; 
    scheduleOption?: 'everyDay' | 'specificDay' | null; 
    selectedDays?: number[]; 
    selectedHours?: number[]; 
    selectedMinutes?: number[]; 
    cronSchedule?: string; 
  }