import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../service/auth.service';

interface FaqItem {
  question: string;
  answer: string;
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="help-wrap">
      <div class="page-header">
        <h1>Centro de ayuda</h1>
        <p class="page-desc">
          Encuentra respuestas a las preguntas más frecuentes y contacta con nuestro equipo de soporte.
        </p>
      </div>

      <!-- Acciones rápidas -->
      <section class="section">
        <h2 class="section-title">Acciones rápidas</h2>
        <div class="actions-grid">
          @for (action of quickActions; track action.title) {
            <div class="action-card">
              <mat-icon class="action-icon">{{ action.icon }}</mat-icon>
              <h3 class="action-title">{{ action.title }}</h3>
              <p class="action-desc">{{ action.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Preguntas frecuentes -->
      <section class="section">
        <h2 class="section-title">Preguntas frecuentes</h2>
        <div class="faq-list">
          @for (faq of faqs; track faq.question; let i = $index) {
            <div class="faq-item" [class.open]="openFaq === i">
              <button class="faq-question" type="button" (click)="toggleFaq(i)">
                <span>{{ faq.question }}</span>
                <mat-icon class="faq-icon">{{ openFaq === i ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
              @if (openFaq === i) {
                <div class="faq-answer">
                  <p>{{ faq.answer }}</p>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Contacto -->
      <section class="section">
        <h2 class="section-title">¿No encuentras lo que buscas?</h2>
        <div class="contact-card">
          <div class="contact-info">
            <h3 class="contact-title">Contacta con soporte</h3>
            <p class="contact-desc">
              Nuestro equipo está disponible para ayudarte. Escríbenos a
              <strong>soporte&#64;comzhichi.com</strong>
            </p>
            <p class="contact-hours">
              <mat-icon class="hours-icon">schedule</mat-icon>
              Lunes a viernes, 8:00 - 18:00
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .help-wrap {
        padding: 24px;
        max-width: 900px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .page-header h1 {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-text);
        margin: 0 0 8px;
      }

      .page-desc {
        font-size: 15px;
        color: var(--color-text);
        opacity: 0.75;
        margin: 0;
        line-height: 1.5;
      }

      .section {
        margin-bottom: 32px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text);
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--color-primary);
      }

      /* Acciones rápidas */
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .action-card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        padding: 20px;
        transition: border-color 0.2s ease, transform 0.15s ease;
        cursor: default;
      }

      .action-card:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }

      .action-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--color-primary);
        margin-bottom: 12px;
      }

      .action-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text);
        margin: 0 0 6px;
      }

      .action-desc {
        font-size: 13px;
        color: var(--color-text);
        opacity: 0.7;
        margin: 0;
        line-height: 1.4;
      }

      /* FAQ */
      .faq-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .faq-item {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        overflow: hidden;
      }

      .faq-item.open {
        border-color: var(--color-primary);
      }

      .faq-question {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text);
        text-align: left;
        font-family: inherit;
      }

      .faq-question:hover {
        background: rgba(140, 35, 156, 0.04);
      }

      .faq-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--color-primary);
        flex-shrink: 0;
        margin-left: 12px;
      }

      .faq-answer {
        padding: 0 16px 14px;
        border-top: 1px solid #f0f0f0;
      }

      .faq-answer p {
        font-size: 14px;
        color: var(--color-text);
        opacity: 0.85;
        line-height: 1.6;
        margin: 12px 0 0;
      }

      /* Contacto */
      .contact-card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        padding: 24px;
      }

      .contact-info {
        flex: 1;
      }

      .contact-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text);
        margin: 0 0 8px;
      }

      .contact-desc {
        font-size: 14px;
        color: var(--color-text);
        opacity: 0.85;
        line-height: 1.6;
        margin: 0 0 12px;
      }

      .contact-desc strong {
        color: #229C78;
        font-weight: 600;
      }

      .contact-hours {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--color-text);
        opacity: 0.7;
        margin: 0;
      }

      .hours-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      @media (max-width: 600px) {
        .help-wrap {
          padding: 16px;
        }

        .actions-grid {
          grid-template-columns: 1fr;
        }

        .contact-card {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .contact-hours {
          justify-content: center;
        }
      }
    `,
  ],
})
export class HelpCenter {
  private auth = inject(AuthService);
  openFaq: number | null = null;

  get userRole(): string {
    return this.auth.currentUser()?.role ?? 'STUDENT';
  }

  get quickActions(): QuickAction[] {
    const actions: Record<string, QuickAction[]> = {
      STUDENT: [
        { icon: 'school', title: 'Matrículas', description: 'Cómo inscribirte en un curso o cambiar de sección.' },
        { icon: 'schedule', title: 'Horarios', description: 'Consulta tus horarios de clase y turnos disponibles.' },
        { icon: 'trending_up', title: 'Progreso', description: 'Revisa tu avance, calificaciones y asistencia.' },
        { icon: 'lock', title: 'Cuenta', description: 'Cambiar contraseña y actualizar tu perfil.' },
      ],
      TEACHER: [
        { icon: 'class', title: 'Secciones', description: 'Gestiona tus secciones y estudiantes asignados.' },
        { icon: 'schedule', title: 'Horario', description: 'Consulta tu horario de clases y aulas.' },
        { icon: 'assignment', title: 'Evaluaciones', description: 'Consulta calificaciones y retroalimentación de tus estudiantes.' },
        { icon: 'lock', title: 'Cuenta', description: 'Cambiar contraseña y actualizar tu perfil.' },
      ],
      COORDINATOR: [
        { icon: 'school', title: 'Cursos', description: 'Administra los cursos y programas disponibles.' },
        { icon: 'people', title: 'Docentes', description: 'Gestiona el equipo de profesores.' },
        { icon: 'schedule', title: 'Horarios', description: 'Configura horarios y asignación de aulas.' },
        { icon: 'lock', title: 'Cuenta', description: 'Cambiar contraseña y actualizar tu perfil.' },
      ],
      PARENT: [
        { icon: 'child_care', title: 'Seguimiento', description: 'Revisa el progreso y asistencia de tu familiar.' },
        { icon: 'notifications', title: 'Notificaciones', description: 'Consulta avisos y comunicados del centro.' },
        { icon: 'schedule', title: 'Horarios', description: 'Consulta los horarios de clase de tu familiar.' },
        { icon: 'lock', title: 'Cuenta', description: 'Cambiar contraseña y actualizar tu perfil.' },
      ],
    };
    return actions[this.userRole] ?? actions['STUDENT'];
  }

  get faqs(): FaqItem[] {
    const faqs: Record<string, FaqItem[]> = {
      STUDENT: [
        { question: '¿Cómo me matriculo en un curso?', answer: 'Dirígete a la sección "Matrículas" desde el menú principal. Allí podrás ver los cursos disponibles, filtrar por turno y seleccionar el que mejor se adapte a tu horario. Una vez seleccionado, confirma tu inscripción.' },
        { question: '¿Cómo cambio mi contraseña?', answer: 'Ve a "Ajustes" en el menú lateral. En la sección "Cambiar contraseña", ingresa tu contraseña actual, la nueva contraseña y confírmala. La nueva contraseña debe tener al menos 6 caracteres.' },
        { question: '¿Dónde puedo ver mi horario de clases?', answer: 'En el menú principal, selecciona "Horarios". Allí verás un resumen de tus clases programadas, incluyendo día, hora, aula y profesor asignado.' },
        { question: '¿Cómo consulto mi progreso académico?', answer: 'Accede a "Progreso" desde el menú principal. Podrás ver tus calificaciones por módulo, porcentaje de asistencia y un resumen general de tu desempeño en el curso.' },
        { question: '¿Qué hago si no puedo acceder a mi cuenta?', answer: 'Si olvidaste tu contraseña, usa la opción "¿No tienes cuenta? Crear cuenta" en la pantalla de login para restablecerla. Si el problema persiste, contacta a soporte técnico.' },
        { question: '¿Cómo contacto con mi profesor o coordinador?', answer: 'Escribe a soporte&#64;comzhichi.com indicando tu nombre, el curso involucrado y el motivo de tu consulta. El equipo de soporte canalizará tu mensaje con la persona correspondiente.' },
      ],
      TEACHER: [
        { question: '¿Cómo consulto las calificaciones de mis estudiantes?', answer: 'Ve a "Evaluaciones" desde el menú principal. Allí verás un listado con todas las calificaciones registradas para tus secciones, incluyendo tipo de evaluación, fecha, puntaje y retroalimentación de cada estudiante.' },
        { question: '¿Cómo cambio mi contraseña?', answer: 'Ve a "Ajustes" en el menú lateral. En la sección "Cambiar contraseña", ingresa tu contraseña actual, la nueva contraseña y confírmala. La nueva contraseña debe tener al menos 6 caracteres.' },
        { question: '¿Dónde puedo ver mi horario de clases?', answer: 'En el menú principal, selecciona "Horario". Allí verás un resumen de tus clases programadas, incluyendo día, hora y aula asignada.' },
        { question: '¿Cómo contacto con el coordinador académico?', answer: 'Escribe a soporte&#64;comzhichi.com indicando tu nombre, la sección involucrada y el motivo de tu consulta. El equipo de soporte canalizará tu mensaje con el coordinador correspondiente.' },
        { question: '¿Qué hago si no puedo acceder a mi cuenta?', answer: 'Si olvidaste tu contraseña, contacta al coordinador académico o a soporte técnico para restablecerla.' },
      ],
      COORDINATOR: [
        { question: '¿Cómo agrego un nuevo curso al sistema?', answer: 'Ve a "Cursos" desde el menú principal. Haz clic en "Nuevo curso" y completa la información requerida: nombre, nivel, descripción y requisitos.' },
        { question: '¿Cómo gestiono el equipo docente?', answer: 'Ve a "Docentes" desde el menú principal. Allí verás el listado de todos los profesores registrados. Puedes dar de baja a un docente si es necesario. La asignación de docentes a secciones se realiza al crear o editar una sección.' },
        { question: '¿Cómo cambio mi contraseña?', answer: 'Ve a "Ajustes" en el menú lateral. En la sección "Cambiar contraseña", ingresa tu contraseña actual, la nueva contraseña y confírmala. La nueva contraseña debe tener al menos 6 caracteres.' },
        { question: '¿Cómo consulto el análisis de demanda?', answer: 'Ve a "Demanda" desde el menú principal. Allí verás un resumen de matrículas agrupadas por idioma, nivel y turno, con el número de secciones, matriculados y vacantes disponibles. Puedes exportar los datos en formato CSV.' },
        { question: '¿Qué hago si no puedo acceder a mi cuenta?', answer: 'Contacta al administrador del sistema o a soporte técnico para restablecer tu acceso.' },
      ],
      PARENT: [
        { question: '¿Cómo veo el progreso de mi familiar?', answer: 'Ve a "Seguimiento" desde el menú principal. Allí podrás ver las calificaciones, asistencia y comentarios de los profesores sobre el desempeño de tu familiar.' },
        { question: '¿Cómo cambio mi contraseña?', answer: 'Ve a "Ajustes" en el menú lateral. En la sección "Cambiar contraseña", ingresa tu contraseña actual, la nueva contraseña y confírmala. La nueva contraseña debe tener al menos 6 caracteres.' },
        { question: '¿Dónde puedo ver los horarios de mi familiar?', answer: 'En el menú principal, selecciona "Horarios". Allí verás el horario de clases de tu familiar, incluyendo día, hora y aula.' },
        { question: '¿Cómo recibo notificaciones del centro?', answer: 'Ve a "Notificaciones" desde el menú principal. Allí verás todos los avisos, comunicados y alertas del centro educativo.' },
        { question: '¿Cómo contacto con el profesor de mi familiar?', answer: 'Escribe a soporte&#64;comzhichi.com indicando el nombre de tu familiar, el curso y el motivo de tu consulta. El equipo de soporte canalizará tu mensaje con el docente correspondiente.' },
      ],
    };
    return faqs[this.userRole] ?? faqs['STUDENT'];
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
