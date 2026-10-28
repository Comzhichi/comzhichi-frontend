import { Pipe, PipeTransform } from '@angular/core';

const FLAGS: Record<string, string> = {
  inglés: 'en', english: 'en', ingles: 'en',
  'inglés americano': 'en', 'american english': 'en',
  francés: 'fr', french: 'fr', frances: 'fr',
  alemán: 'de', german: 'de', aleman: 'de',
  italiano: 'it', italian: 'it',
  portugués: 'pt', portuguese: 'pt', portugues: 'pt',
  español: 'es', spanish: 'es', espanol: 'es',
  japonés: 'en', japanese: 'en', japones: 'en',
  chino: 'en', chinese: 'en', mandarín: 'en', mandarin: 'en',
  coreano: 'en', korean: 'en',
  ruso: 'en', russian: 'en',
};

@Pipe({ name: 'languageFlag', standalone: true })
export class LanguageFlagPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '/flag-en.png';
    const key = value.trim().toLowerCase();
    let code = FLAGS[key];
    if (!code) {
      for (const k of Object.keys(FLAGS)) {
        if (key.includes(k)) { code = FLAGS[k]; break; }
      }
    }
    if (!code) code = 'en';
    return `/flag-${code}.png`;
  }
}