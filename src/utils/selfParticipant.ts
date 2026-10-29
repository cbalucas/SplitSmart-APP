/**
 * selfParticipant.ts
 *
 * Id del "amigo propio" (el participante que representa al usuario).
 *
 * Es DETERMINISTA: el mismo usuario obtiene el mismo id en cualquier dispositivo. Con un id
 * aleatorio, iniciar sesión en la web y luego en la app (o al revés) creaba un participante
 * propio en cada dispositivo; al sincronizar quedaban dos filas con el mismo user_id.
 * Con el mismo id, ambos dispositivos escriben la misma fila y convergen.
 *
 * Se deriva con SHA-256 (128 bits) y no con el PRNG de 32 bits de deterministicId, para que
 * dos usuarios distintos no puedan colisionar en el mismo id.
 */

import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from '@noble/hashes/utils';

export function selfParticipantId(userId: string): string {
  const b = sha256(utf8ToBytes(`splitsmart-self-participant:${userId}`)).slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
