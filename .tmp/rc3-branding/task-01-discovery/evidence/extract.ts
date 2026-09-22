import { writeFileSync, readFileSync } from 'node:fs'
import { createFullCareerDependencies } from '@/content/full-career'
import { materializeVariant } from '@/game/testing/materialize'
import { GRADE_7_HOSTABLE_TEMPLATES } from '@/content/grade-7/composition'
import { simulateRun } from '@/game/testing/agent'
import { developmentRunDescriptor } from '@/game/testing/simulation'
const deps = createFullCareerDependencies()
const raw = JSON.parse(readFileSync('src/content/grade-5/variant-catalog.grade-5-dev-6.json', 'utf8'))
const entries = raw.entries
const templates = deps.catalog.templates.map(t => {
  const approved = entries.filter(e => e.templateId === t.id || e.ref?.templateId === t.id)
  const variants = approved.map(e => e.variantId ?? e.ref?.variantId)
  const instance = materializeVariant(t, { seed: 'rc3-discovery', ...(variants[0] ? {variantId: variants[0]} : {}) })
  return {
    id:t.id, family:t.family, placement:t.placement, stages:t.stages,
    categories:t.categories, interaction:t.interaction, composition:t.composition,
    authoredVariants:t.variants, approvedVariants:variants,
    source:t.variantSource.id, narrative:instance.narrative, presentation:instance.present([]),
    publicEligible: t.stages[0] !== 'grade-7' || t.placement === 'recovery' || GRADE_7_HOSTABLE_TEMPLATES.includes(t.id as never),
  }
})
const data = { catalogVersion:raw.catalogVersion, entryCount:entries.length, families:deps.catalog.families, templates,
  storylets:deps.storylets, recovery:deps.recoveryContent, rareEvents:deps.rareEvents }
writeFileSync('.tmp/rc3-branding/task-01-discovery/evidence/catalog.json', JSON.stringify(data,null,2)+'\n')
const witnesses = { templates: {}, storylets: {}, rareEvents: {}, runs: 0, completed: 0 }
for (let i=0;i<128;i++) {
  const seed = `rc3-discovery-${i}`
  const result = simulateRun(developmentRunDescriptor(seed,deps,{mode:'fair',difficulty:'fixed'}),deps)
  if (!result.ok) throw new Error(JSON.stringify(result.error))
  const state = result.value.state
  witnesses.runs++
  if (state.completion?.graduated) witnesses.completed++
  for (const h of state.history) {
    if (h.challengeId) witnesses.templates[h.challengeId] ??= seed
    if (h.storyletId) witnesses.storylets[h.storyletId] ??= seed
  }
  for (const id of state.seenStorylets) witnesses.storylets[id] ??= seed
  for (const rare of state.rare) witnesses.rareEvents[rare.id] ??= seed
}
writeFileSync('.tmp/rc3-branding/task-01-discovery/evidence/reachability.json',JSON.stringify(witnesses,null,2)+'\n')
console.log(JSON.stringify({families:data.families.length, templates:templates.length, variants:entries.length,
  templatesSummary:templates.map(t=>({id:t.id,family:t.family,role:t.placement,interaction:t.interaction,approved:t.approvedVariants.length,title:t.narrative.title,public:t.publicEligible}))},null,2))
