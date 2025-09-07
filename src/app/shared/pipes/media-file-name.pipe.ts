import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mediaFileName',
})
export class MediaFileNamePipe implements PipeTransform {
  public transform(value: string): string {
    if (!value) {
      return '';
    }
    const regex = /^\d{13}-/;
    return value.replace(regex, '');
  }
}
