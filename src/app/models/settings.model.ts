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

export interface Settings {
  tenant_id: string;
  name: string;
  selectedRadioStream?: string;
  radioStreamList?: RadioStream[];
  footerVisibilityRules: FooterVisibilityRule[];
  pictureSlideDuration?: number;
  location?: Location;
}