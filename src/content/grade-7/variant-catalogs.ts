/**
 * Los catálogos de variantes aprobadas de 7.º grado.
 *
 * Una versión publicada no se edita. Cuando el contenido cambia —una plantilla
 * nueva, otra variante curada— se construye la **siguiente** versión y la
 * anterior queda tal como estaba: una run que declaró `grade-7-dev-1` tiene que
 * poder resolverse contra el conjunto que realmente jugó, y sobrescribirlo
 * habría reescrito esa historia.
 *
 * Todos son catálogos de **desarrollo**. Ninguno es el catálogo de la feria:
 * congelar el oficial de una competencia es una decisión de evento que todavía
 * no se tomó.
 */

import {
  approvedVariantLookup,
  isErr,
  parseApprovedVariantCatalog,
  type ApprovedVariantCatalog,
  type ApprovedVariantLookup,
} from '@/game'
import catalogDev1 from './variant-catalog.grade-7-dev-1.json' with { type: 'json' }
import catalogDev2 from './variant-catalog.grade-7-dev-2.json' with { type: 'json' }
import catalogDev3 from './variant-catalog.grade-7-dev-3.json' with { type: 'json' }
import catalogDev4 from './variant-catalog.grade-7-dev-4.json' with { type: 'json' }
import catalogDev5 from './variant-catalog.grade-7-dev-5.json' with { type: 'json' }
import catalogDev6 from './variant-catalog.grade-7-dev-6.json' with { type: 'json' }
import { GRADE_7_VARIANT_CATALOG_VERSION } from './versions'

/**
 * Un artefacto en disco es una frontera, y se parsea.
 *
 * Un catálogo corrupto tiene que fallar acá, al cargar el content set, y no más
 * tarde como una dirección que no resuelve.
 */
function published(artifact: unknown): ApprovedVariantCatalog {
  const parsed = parseApprovedVariantCatalog(artifact)
  if (isErr(parsed)) {
    throw new Error(
      `catálogo de variantes inválido: ${parsed.error.kind === 'invalid-content' ? parsed.error.issues.join('; ') : parsed.error.kind}`,
    )
  }
  return parsed.value
}

/** Toda versión publicada, la vigente incluida, por versión. */
export const grade7VariantCatalogs: Readonly<
  Record<string, ApprovedVariantCatalog>
> = {
  'grade-7-dev-1': published(catalogDev1),
  'grade-7-dev-2': published(catalogDev2),
  'grade-7-dev-3': published(catalogDev3),
  'grade-7-dev-4': published(catalogDev4),
  'grade-7-dev-5': published(catalogDev5),
  'grade-7-dev-6': published(catalogDev6),
}

/** El catálogo del que sale el contenido de una partida nueva. */
export const grade7VariantCatalog: ApprovedVariantCatalog = (() => {
  const current = grade7VariantCatalogs[GRADE_7_VARIANT_CATALOG_VERSION]
  if (current === undefined) {
    throw new Error(
      `no hay catálogo publicado para ${GRADE_7_VARIANT_CATALOG_VERSION}`,
    )
  }
  return current
})()

/** La vista que el motor consume para elegir dentro de lo aprobado. */
export const grade7ApprovedVariants: ApprovedVariantLookup =
  approvedVariantLookup(grade7VariantCatalog)
