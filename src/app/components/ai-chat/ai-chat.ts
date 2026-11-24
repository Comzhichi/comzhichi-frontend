import {
  Component, EventEmitter, Input, Output,
  inject, signal, OnDestroy, ElementRef, ViewChild, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgentService } from '../../service/agent.service';
import {
  ChatResponse, GroupSummary, ParentReport,
  SectionSummary, CourseRecommendation, EnrollResult
} from '../../model/agent.model';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  report?: ParentReport;
  groupSummary?: GroupSummary;
  sections?: SectionSummary[];
  recommendations?: CourseRecommendation[];
  enrollResult?: EnrollResult;
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
export class AiChat implements OnDestroy, AfterViewChecked {
  private agentService = inject(AgentService);

  @Input() role: 'STUDENT' | 'TEACHER' | 'COORDINATOR' | 'PARENT' = 'STUDENT';
  @Output() closed = new EventEmitter<void>();
  @ViewChild('messagesEnd') messagesEnd?: ElementRef;

  messages = signal<Message[]>([]);
  inputText = signal('');
  isMinimized = signal(false);
  isLoading = signal(false);
  isListening = signal(false);

  private recognition: any = null;

  get welcomeMessage(): string {
    const messages: Record<string, string> = {
      STUDENT: '¡Hola! Soy el agente IA de Comzhichi. Puedo ayudarte a buscar cursos, recomendarte el siguiente nivel o matricularte directamente.',
      TEACHER: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      COORDINATOR: '¡Hola! Bienvenido al agente IA de Comzhichi. ¿En qué puedo ayudarte hoy?',
      PARENT: '¡Hola! Bienvenido al agente IA de Comzhichi. Pregúntame por el avance, asistencia o notas de tu representado.',
    };
    return messages[this.role] ?? messages['STUDENT'];
  }

  get suggestedPrompts(): SuggestedPrompt[] {
    const prompts: Record<string, SuggestedPrompt[]> = {
      STUDENT: [
        { text: '¿Qué cursos de inglés hay disponibles?' },
        { text: 'Recomiéndame el siguiente nivel según mi historial' },
        { text: 'Quiero matricularme en un curso' },
      ],
      TEACHER: [
        { text: 'Genera un resumen del desempeño de un grupo (indica el código)' },
      ],
      COORDINATOR: [
        { text: 'Indica secciones con vacantes disponibles' },
      ],
      PARENT: [
        { text: 'Genera un resumen del progreso y asistencia de mi familiar' },
      ],
    };
    return prompts[this.role] ?? prompts['STUDENT'];
  }

  get voiceSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  ngAfterViewChecked(): void {
    this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    this.recognition?.abort();
  }

  toggleVoice(): void {
    if (this.isListening()) {
      this.recognition?.stop();
      this.isListening.set(false);
      return;
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.recognition = new SR();
    this.recognition!.lang = 'es-PE';
    this.recognition!.interimResults = false;
    this.recognition!.maxAlternatives = 1;

    this.recognition!.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      this.inputText.set(transcript);
      this.isListening.set(false);
      this.sendMessage();
    };

    this.recognition!.onerror = () => this.isListening.set(false);
    this.recognition!.onend = () => this.isListening.set(false);

    this.recognition!.start();
    this.isListening.set(true);
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
        const sections = this.asSectionList(res?.data);
        const recommendations = this.asRecommendationList(res?.data);
        const enrollResult = this.asEnrollResult(res?.data);

        this.messages.update((msgs) => [
          ...msgs,
          {
            text: res?.message || 'Sin respuesta del agente.',
            isUser: false,
            timestamp: new Date(),
            report: report ?? undefined,
            groupSummary: groupSummary ?? undefined,
            sections: sections ?? undefined,
            recommendations: recommendations ?? undefined,
            enrollResult: enrollResult ?? undefined,
          },
        ]);
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          {
            text: 'No se pudo obtener respuesta del agente. Inténtalo nuevamente.',
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        this.isLoading.set(false);
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

  // --- type guards ---

  private asParentReport(data: unknown): ParentReport | null {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d['status'] !== 'string' || !Array.isArray(d['items'])) return null;
    return d as unknown as ParentReport;
  }

  private asGroupSummary(data: unknown): GroupSummary | null {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d['status'] !== 'string') return null;
    if (!('groupCode' in d) && !('totalEnrollments' in d)) return null;
    return d as unknown as GroupSummary;
  }

  private asSectionList(data: unknown): SectionSummary[] | null {
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0] as Record<string, unknown>;
    if (!('groupCode' in first) || !('availableVacancies' in first)) return null;
    return data as SectionSummary[];
  }

  private asRecommendationList(data: unknown): CourseRecommendation[] | null {
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0] as Record<string, unknown>;
    if (!('language' in first) || !('status' in first)) return null;
    return data as CourseRecommendation[];
  }

  private asEnrollResult(data: unknown): EnrollResult | null {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const d = data as Record<string, unknown>;
    const validStatuses = ['CONFIRMATION_REQUIRED', 'ENROLLED', 'REJECTED', 'NOT_FOUND', 'NO_VACANCIES'];
    if (typeof d['status'] !== 'string' || !validStatuses.includes(d['status'])) return null;
    return d as unknown as EnrollResult;
  }
}