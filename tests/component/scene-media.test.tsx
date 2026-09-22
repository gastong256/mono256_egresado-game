// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChallengeFrame } from '@/components/game/challenge-frame'
import { SceneMedia } from '@/components/game/scene-media'
import { grade1VariantCatalog } from '@/content/grade-1'
import { scaleFitReview } from '@/content/grade-1/challenges/classroom-layout'
import { courseProjectExpo } from '@/content/grade-1/challenges/course-project-expo'
import { materializeVariant } from '@/game/testing'
import {
  toVariantId,
  type ChallengeDefinition,
  type PublicChallengeView,
} from '@/game'

/**
 * La escena dentro del marco de un desafío.
 *
 * Se prueba con contenido real de 1.º: la expo tiene ilustración y el Repaso de
 * medir y encastrar no. Lo que importa es la posición, la semántica accesible y
 * que una situación sin imagen siga completa.
 */

function viewFor(
  template: ChallengeDefinition,
  extra: Partial<PublicChallengeView> = {},
): PublicChallengeView {
  const entry = grade1VariantCatalog.entries.find(
    (candidate) => candidate.templateId === template.id,
  )
  if (entry === undefined) throw new Error('no approved variant')
  const instance = materializeVariant(template, {
    variantId: toVariantId(String(entry.variantId)),
    seed: 'scene-media',
  })
  return {
    ref: instance.ref,
    narrative: instance.narrative,
    interaction: instance.present([]),
    tools: instance.tools,
    ...extra,
  }
}

function renderFrame(view: PublicChallengeView) {
  return render(
    <ChallengeFrame
      view={view}
      eyebrow="Primer año · Proyecto del Curso"
      draft={undefined}
      disabled={false}
      onDraftChange={() => undefined}
      onRequestInformation={() => undefined}
    />,
  )
}

function follows(before: Element, after: Element): boolean {
  return Boolean(
    before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING,
  )
}

describe('scene media in a challenge', () => {
  it('mounts the template scene between the title and the setup, decoratively', () => {
    const view = viewFor(courseProjectExpo)
    renderFrame(view)

    const media = screen.getByTestId('scene-media')
    const image = media.querySelector('img')
    if (image === null) throw new Error('no image rendered')

    expect(image.getAttribute('src')).toContain('y1-expo.webp')
    // Ambientación: el eyebrow, el título y la prosa ya sitúan la escena, así
    // que un lector de pantalla no la vuelve a escuchar.
    expect(image.getAttribute('alt')).toBe('')
    expect(screen.queryByRole('img')).toBeNull()

    const title = screen.getByRole('heading', { name: view.narrative.title })
    const setup = screen.getByText(view.narrative.setup)
    expect(follows(title, media)).toBe(true)
    expect(follows(media, setup)).toBe(true)
  })

  it('reserves a 16:9 box so the layout does not shift when the image lands', () => {
    renderFrame(viewFor(courseProjectExpo))
    expect(screen.getByTestId('scene-media')).toHaveClass('aspect-video')
  })

  it('renders a remediation beat without a scene and with its interaction intact', () => {
    const view = viewFor(scaleFitReview, {
      review: { practised: [], debriefed: [] },
    })
    renderFrame(view)

    expect(screen.queryByTestId('scene-media')).toBeNull()
    expect(
      screen.getByRole('heading', { name: view.narrative.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(view.narrative.goal)).toBeInTheDocument()
  })

  it('does not preload: the scene is never marked as priority', () => {
    renderFrame(viewFor(courseProjectExpo))
    const image = screen.getByTestId('scene-media').querySelector('img')
    expect(image?.getAttribute('fetchpriority')).not.toBe('high')
    expect(document.querySelector('link[rel="preload"][as="image"]')).toBeNull()
  })

  it('accepts an explicit alt when the image says something the text does not', () => {
    render(
      <SceneMedia
        src="/assets/scenes/g7-bus.webp"
        alt="Una parada de colectivo a la mañana"
      />,
    )
    expect(
      screen.getByRole('img', { name: 'Una parada de colectivo a la mañana' }),
    ).toBeInTheDocument()
  })
})
