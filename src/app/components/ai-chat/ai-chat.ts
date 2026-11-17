import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgentService } from '../../service/agent.service';
import { ChatResponse, GroupSummary, ParentReport } from '../../model/agent.model';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  report?: ParentReport;
  groupSummary?: GroupSummary;
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.css',
})
export class AiChat {
  private agentService = inject(AgentService);

  @Input() role: 'STUDENT' | 'TEACHER' | 'COORDINATOR' | 'PARENT' = 'STUDENT';
  @Output() closed = new EventEmitter<void>();

  messages = signal<Message[]>([]);
  inputText = signal('');
  isMinimized = signal(false);
  isLoading = signal(false);

  get welcomeMessage(): string {
    const messages: Record<string, string> = {
      STUDENT: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      TEACHER: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      COORDINATOR: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      PARENT: '¡Hola! Bienvenido al agente IA de Comzhichi. Pregúntame por el avance, asistencia o notas de tu representado.',
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
        { text: 'Genera un resumen del desempeño de un grupo (indica el código)' },
        { text: 'Asígnale "Presente" en asistencia a todos los estudiantes de la sección que te especificaré' },
      ],
      COORDINATOR: [
        { text: 'Indicame secciones y cursos con vacantes disponibles para transferencias' },
        { text: 'Genera un resumen bien detallado de los idiomas con mayor demanda' },
      ],
      PARENT: [
        { text: 'Genera un resumen del progreso y asistencia de mi familiar' },
      ],
    };
    return prompts[this.role] ?? prompts['STUDENT'];
  }

  sendMessage(): void {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) return;

    this.messages.update((msgs) => [
      ...msgs,
      { text, isUser: true, timestamp: new Date() },
    ]);
    this.inputText.set('');
    this.isLoading.set(true);

    this.agentService.chat(text).subscribe({
      next: (res: ChatResponse) => {
        const report = this.asParentReport(res?.data);
        const groupSummary = this.asGroupSummary(res?.data);
        this.messages.update((msgs) => [
          ...msgs,
          {
            text: res?.message || 'Sin respuesta del agente.',
            isUser: false,
            timestamp: new Date(),
            report: report ?? undefined,
            groupSummary: groupSummary ?? undefined,
          },
        ]);
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          { text: 'No se pudo obtener respuesta del agente. Inténtalo nuevamente.', isUser: false, timestamp: new Date() },
        ]);
      },
      complete: () => this.isLoading.set(false),
    });
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

  private asGroupSummary(data: unknown): GroupSummary | null {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d['status'] !== 'string') return null;
    if (!('groupCode' in d) && !('totalEnrollments' in d) && !('observations' in d)) return null;
    return d as unknown as GroupSummary;
  }

  private asParentReport(data: unknown): ParentReport | null {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d['status'] !== 'string' || !Array.isArray(d['items'])) return null;
    return d as unknown as ParentReport;
  }
}