export interface Settings {
    selectedRadioStream: string | null;
    radioStreamList: RadioStream[];
    footerVisibilityRules: FooterVisibilityRule[];
    pictureSlideDuration: number;
  }
  
  export interface FooterVisibilityRule {
    startMinute: number | null;
    endMinute: number | null;
  }
  
  export interface RadioStream {
    url: string;
    description: string;
  }