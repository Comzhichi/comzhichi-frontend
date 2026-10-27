-- Script para poblar la tabla de secciones/cursos de Comzhichi
-- Ejecutar en la base de datos del backend (ajusta nombres de tabla/columna si difieren)

CREATE TABLE IF NOT EXISTS section (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_code VARCHAR(20) NOT NULL,
    day_of_week VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50),
    total_vacancies INT NOT NULL DEFAULT 0,
    available_vacancies INT NOT NULL DEFAULT 0,
    course_id BIGINT,
    course_name VARCHAR(100) NOT NULL,
    course_description VARCHAR(255),
    course_level VARCHAR(50),
    teacher_id BIGINT,
    teacher_name VARCHAR(100),
    teacher_specialty VARCHAR(100)
);

INSERT INTO section (group_code, day_of_week, start_time, end_time, classroom, total_vacancies, available_vacancies, course_id, course_name, course_description, course_level, teacher_id, teacher_name, teacher_specialty) VALUES
('A', 'Lunes/Miercoles', '08:00:00', '10:00:00', 'Aula 1', 20, 5, 1, 'Ingles Basico', 'Fundamentos del idioma ingles', 'Basico', 1, 'Prof. Garcia', 'Ingles'),
('B', 'Martes/Jueves', '10:00:00', '12:00:00', 'Aula 2', 20, 0, 2, 'Ingles Intermedio', 'Conversacion y gramatica intermedia', 'Intermedio', 2, 'Prof. Lopez', 'Ingles'),
('C', 'Lunes/Miercoles', '18:00:00', '20:00:00', 'Aula 3', 20, 8, 3, 'Frances Basico', 'Introduccion al frances', 'Basico', 3, 'Prof. Dubois', 'Frances'),
('D', 'Martes/Jueves', '14:00:00', '16:00:00', 'Aula 4', 20, 3, 4, 'Aleman Intermedio', 'Gramatica y conversacion en aleman', 'Intermedio', 4, 'Prof. Muller', 'Aleman'),
('E', 'Viernes', '09:00:00', '11:00:00', 'Aula 5', 20, 2, 5, 'Portugues Avanzado', 'Perfeccionamiento del portugues', 'Avanzado', 5, 'Prof. Silva', 'Portugues');
