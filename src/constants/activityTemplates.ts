/**
 * Plantillas de organización por defecto.
 *
 * Estas plantillas vienen incluidas en la app y sirven como punto de partida
 * para crear actividades dentro de un evento. El usuario puede aplicarlas y
 * luego editar las actividades resultantes, o crear sus propias plantillas
 * (guardadas localmente por usuario en la tabla `activity_templates`).
 *
 * Cada plantilla define un `nameKey` (clave de traducción) y una lista de
 * `taskKeys` (claves de traducción para cada tarea). Al aplicarla se generan
 * actividades con los títulos ya traducidos al idioma actual.
 */

export interface DefaultActivityTemplate {
  /** Identificador estable de la plantilla por defecto. */
  id: string;
  /** Clave de traducción para el nombre de la plantilla. */
  nameKey: string;
  /** Claves de traducción para los títulos de cada tarea. */
  taskKeys: string[];
}

export const DEFAULT_ACTIVITY_TEMPLATES: DefaultActivityTemplate[] = [
  {
    id: 'default-juntada',
    nameKey: 'organization.templates.gathering.name',
    taskKeys: [
      'organization.templates.gathering.food',
      'organization.templates.gathering.drinksIce',
      'organization.templates.gathering.snacksBread',
      'organization.templates.gathering.dessert',
    ],
  },
  {
    id: 'default-asado',
    nameKey: 'organization.templates.bbq.name',
    taskKeys: [
      'organization.templates.bbq.meat',
      'organization.templates.bbq.charcoal',
      'organization.templates.bbq.saladsSides',
      'organization.templates.bbq.drinksIce',
      'organization.templates.bbq.dessert',
    ],
  },
  {
    id: 'default-viaje',
    nameKey: 'organization.templates.trip.name',
    taskKeys: [
      'organization.templates.trip.accommodation',
      'organization.templates.trip.transport',
      'organization.templates.trip.food',
      'organization.templates.trip.activities',
    ],
  },
];
