/**
 * Los parámetros de las variantes **publicadas** de una Template.
 *
 * Los tests de contenido que antes barrían el espacio de candidatas entero
 * miden ahora lo que el catálogo aprobado realmente trae: es lo que un jugador
 * puede ver, y es sobre lo que los contratos de remediación matemática fijan
 * sus criterios.
 */
import {
  createVariantRng,
  type ApprovedVariantCatalog,
  type EngineDependencies,
} from '@/game'

export function publishedParams<P>(
  dependencies: EngineDependencies,
  catalog: ApprovedVariantCatalog,
  templateId: string,
  parse: (params: unknown) => P,
): readonly P[] {
  const template = dependencies.catalog.template(templateId as never)
  if (template === undefined) throw new Error(`falta ${templateId}`)
  return catalog.entries
    .filter((entry) => (entry.templateId as string) === templateId)
    .map((entry) =>
      parse(
        template.variantSource.canonicalFor(
          entry.variantId,
          createVariantRng({
            familyId: entry.familyId,
            templateId: entry.templateId,
            variantId: entry.variantId,
          }),
        ),
      ),
    )
}
