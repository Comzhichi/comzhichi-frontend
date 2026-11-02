import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface SuggestedPrompt {
  text: string;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.css',
})
export class AiChat {
  @Input() role: 'STUDENT' | 'TEACHER' | 'COORDINATOR' | 'PARENT' = 'STUDENT';
  @Output() closed = new EventEmitter<void>();

  messages = signal<Message[]>([]);
  inputText = signal('');
  isMinimized = signal(false);

  get welcomeMessage(): string {
    const messages: Record<string, string> = {
      STUDENT: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      TEACHER: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      COORDINATOR: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      PARENT: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
    };
    return messages[this.role] ?? messages['STUDENT'];
  }

  get suggestedPrompts(): SuggestedPrompt[] {
    const prompts: Record<string, SuggestedPrompt[]> = {
      STUDENT: [
        { text: 'Recomiéndame cursos y/o niveles en base a mi historial académico' },
        { text: 'Registra una matrícula en el curso que te especificaré' },
      ],
      TEACHER: [
        { text: 'Genera un resumen del desempeño de los estudiantes con más faltas' },
        { text: 'Asígnale "Presente" en asistencia a todos los estudiantes de la sección que te especificaré' },
      ],
      COORDINATOR: [
        { text: 'Indicame secciones y cursos con vacantes disponibles para transferencias' },
        { text: 'Genera un resumen bien detallado de los idiomas con mayor demanda' },
      ],
      PARENT: [
        { text: 'Genera un resumen del progreso y asistencia de mi familiar' },
        { text: 'Matricula a mi familiar en el curso que te especificaré' },
      ],
    };
    return prompts[this.role] ?? prompts['STUDENT'];
  }

  sendMessage(): void {
    const text = this.inputText().trim();
    if (!text) return;

    this.messages.update((msgs) => [
      ...msgs,
      { text, isUser: true, timestamp: new Date() },
    ]);
    this.inputText.set('');

    // TODO: Implement AI response logic
  }

  selectPrompt(prompt: SuggestedPrompt): void {
    this.inputText.set(prompt.text);
    this.sendMessage();
  }

  toggleMinimize(): void {
    this.isMinimized.update((v) => !v);
  }

  close(): void {
    this.closed.emit();
  }
}
