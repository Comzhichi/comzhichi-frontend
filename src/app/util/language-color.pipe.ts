import { Pipe, PipeTransform } from '@angular/core';

const COLORS: Record<string, string> = {
  inglés: '#fdecec', english: '#fdecec', ingles: '#fdecec',
  'inglés americano': '#fdecec', 'american english': '#fdecec',
  francés: '#eaf4ff', french: '#eaf4ff', frances: '#eaf4ff',
  alemán: '#fff8e6', german: '#fff8e6', aleman: '#fff8e6',
  italiano: '#edf8f1', italian: '#edf8f1',
  portugués: '#edf8f1', portuguese: '#edf8f1', portugues: '#edf8f1',
  español: '#fdecec', spanish: '#fdecec', espanol: '#fdecec',
};

@Pipe({ name: 'languageColor', standalone: true })
export class LanguageColorPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'color-mix(in srgb, var(--color-primary) 15%, white)';
    const key = value.trim().toLowerCase();
    let color = COLORS[key];
    if (!color) {
      for (const k of Object.keys(COLORS)) {
        if (key.includes(k)) { color = COLORS[k]; break; }
      }
    }
    return color ?? 'color-mix(in srgb, var(--color-primary) 15%, white)';
  }
}