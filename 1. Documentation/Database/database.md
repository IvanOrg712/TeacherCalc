# 1. Diccionario de Datos y Estructura
## Niveles Organizacionales

TEACHERS: Usuario principal. Gestiona la autenticación (email/password).
SCHOOLS: Configura los parámetros globales: passing_grade (nota mínima aprobatoria) y midterm_count (número de parciales).
SUBJECTS: Define el límite de faltas (absences_allowed) para el cálculo de alertas visuales en el frontend.
GROUPS: Entidad operativa donde se vinculan alumnos y registros.
GROUP_STUDENTS: Tabla intermedia que permite el reordenamiento manual de alumnos mediante display_order.

## Registro de Desempeño

ATTENDANCE: Almacena el estado binario (0: ausente, 1: presente) vinculado a una fecha y un parcial específico.
EVALUATIONS: Categorías de peso (ej. "Examen", "Tareas"). Pueden tener un peso fijo (is_fixed) o automático.
ACTIVITIES: Tareas individuales. Incluye max_score para manejar escalas (ej. 0/30) y is_extra_points para puntos adicionales.
GRADES: La calificación cruda obtenida por el alumno en una actividad específica.

# 2. Procesos Críticos del Backend
El backend no solo debe servir como repositorio de datos, sino como el motor de cálculo de toda la lógica académica.

## A. Motor de Cálculo de Pesos (Weights)

El sistema debe recalcular dinámicamente los porcentajes cuando se añade o modifica una evaluación o actividad:
Validación de Suma: Al recibir un valor fijo, el backend debe sumar todos los is_fixed = true. Si la suma excede 100, debe disparar un error (ErrorOverlay).
Distribución Automática: Los elementos con is_fixed = false deben recibir un peso igual a:

Peso Automático = Cantidad de elementos automáticos / (100 - ∑Pesos Fijos)

## B. Cálculo de la Calificación Final

Para cada parcial (Midterm), el backend debe ejecutar:

Normalización: Convertir el score de la tabla GRADES a una base 100 usando el max_score de la actividad.
Cálculo Ponderado: Sumar los productos de (Nota Normalizada × Peso de Actividad × Peso de Evaluación).
Lógica de Puntos Extra: 

La lógica de Puntos Extra se define como un bono aditivo que no forma parte del 100% de la evaluación base y requiere obligatoriamente un peso fijo. El proceso de cálculo consiste en obtener primero la Nota Base mediante el promedio ponderado de las actividades normales y, posteriormente, sumar el Bono Extra calculado según el desempeño del estudiante en dicha actividad. Finalmente, el sistema debe aplicar un "techo" matemático utilizando la función `const notaFinal = Math.round(Math.min(notaBase + bonoExtra, escalaMaxima) * 100) / 100;` garantizando que la calificación final nunca exceda el límite establecido (ej. 10 o 100) y redondeando el resultado a dos decimales.

## C. Procesamiento de Asistencia

Validación de Alerta: El backend debe proveer un endpoint que devuelva el conteo total de status = 0 (inasistencias).
Comparativa: Si este conteo > absences_allowed del SUBJECT, el backend debe enviar un flag para que el frontend pinte la celda de rojo.

# 3. Flujos de Trabajo para Desarrollo
Frontend (Consumo de API)

Cascading Updates: Al modificar una celda de calificación o asistencia, el frontend debe enviar la actualización y esperar el nuevo cálculo del "Total" calculado por el backend para refrescar la interfaz.
Configuración de Grupos: Al crear una materia, el frontend envía un string separado por comas; el backend debe limpiar los espacios (trim) y crear N registros en la tabla GROUPS.

## Backend (Endpoints Clave)

| Endpoints | Acción |
| --- | --- |
| POST /evaluations	| Valida que el peso fijo no exceda el remanente del 100%. |
| GET /grades/summary	| Ejecuta el cálculo de pesos automáticos y devuelve la nota final redondeada a 2 decimales. |
| POST /activities	| Si is_extra_points es true, marca automáticamente is_fixed como true y requiere un peso. |