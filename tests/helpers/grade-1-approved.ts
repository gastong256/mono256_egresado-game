/** Parameters behind every approved Grade-1 address, read from the committed catalog. */
import { createVariantRng, toVariantId, type ChallengeDefinition } from '@/game'
import { grade1VariantCatalog } from '@/content/grade-1'

export function approvedParams<P>(
  template: ChallengeDefinition,
  parse: (value: unknown) => P,
): readonly { readonly variantId: string; readonly params: P }[] {
  return grade1VariantCatalog.entries
    .filter((entry) => entry.templateId === template.id)
    .map((entry) => {
      const variantId = toVariantId(String(entry.variantId))
      return {
        variantId,
        params: parse(
          template.variantSource.canonicalFor(
            variantId,
            createVariantRng({
              familyId: template.family,
              templateId: template.id,
              variantId,
            }),
          ),
        ),
      }
    })
}
