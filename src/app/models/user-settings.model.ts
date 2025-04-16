export interface Location {
  type: 'Point';
  coordinates: [number, number];
}


export interface FooterVisibilityRule {
  startMinute: number;
  endMinute: number;
}

export interface UserSettings {
  tenant_id: string;
  language: string;
  country: string;
  name: string;
  selectedRadioStream?: string;
  footerVisibilityRules: FooterVisibilityRule[];
  pictureSlideDuration?: number;
  location?: Location;
  mainLogoUrl?: string;
  separatorLogoUrl?: string;

}