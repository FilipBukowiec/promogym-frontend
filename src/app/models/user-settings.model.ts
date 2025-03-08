export interface Location {
  type: 'Point';
  coordinates: [number, number];
}

export interface RadioStream {
  url: string;
  description: string;
}

export interface FooterVisibilityRule {
  startMinute: number;
  endMinute: number;
}

export interface UserSettings {
  tenant_id: string;
  language: string;
  name: string;
  selectedRadioStream?: string;
  radioStreamList?: RadioStream[];
  footerVisibilityRules: FooterVisibilityRule[];
  pictureSlideDuration?: number;
  location?: Location;
}