function isProtected(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end)
}

function isEscaped(line, index) {
  let backslashes = 0
  for (
    let cursor = index - 1;
    cursor >= 0 && line[cursor] === '\\';
    cursor -= 1
  ) {
    backslashes += 1
  }
  return backslashes % 2 === 1
}

function protectedRanges(line, state) {
  const ranges = []
  let cursor = 0

  while (cursor < line.length) {
    if (state.inComment) {
      const closing = line.indexOf('-->', cursor)
      if (closing === -1) {
        ranges.push([cursor, line.length])
        return ranges
      }
      ranges.push([cursor, closing + 3])
      state.inComment = false
      cursor = closing + 3
      continue
    }

    const commentStart = line.indexOf('<!--', cursor)
    const codeStart = line.indexOf('`', cursor)
    if (commentStart === -1 && codeStart === -1) break

    if (commentStart !== -1 && (codeStart === -1 || commentStart < codeStart)) {
      const closing = line.indexOf('-->', commentStart + 4)
      if (closing === -1) {
        ranges.push([commentStart, line.length])
        state.inComment = true
        return ranges
      }
      ranges.push([commentStart, closing + 3])
      cursor = closing + 3
      continue
    }

    let openingEnd = codeStart
    while (line[openingEnd] === '`') openingEnd += 1
    const marker = line.slice(codeStart, openingEnd)
    let closing = line.indexOf(marker, openingEnd)
    while (closing !== -1) {
      const precedingIsBacktick = closing > 0 && line[closing - 1] === '`'
      const followingIsBacktick = line[closing + marker.length] === '`'
      if (!precedingIsBacktick && !followingIsBacktick) break
      closing = line.indexOf(marker, closing + marker.length)
    }
    if (closing === -1) {
      cursor = openingEnd
      continue
    }

    ranges.push([codeStart, closing + marker.length])
    cursor = closing + marker.length
  }

  return ranges
}

function destinationSpan(line, opening) {
  let start = opening
  while (/\s/.test(line[start] ?? '')) start += 1

  if (line[start] === '<') {
    const closing = line.indexOf('>', start + 1)
    return closing === -1 ? null : { start, end: closing + 1 }
  }

  let depth = 0
  let end = start
  while (end < line.length) {
    const character = line[end]
    if (character === '\\') {
      end += Math.min(2, line.length - end)
      continue
    }
    if (character === '(') depth += 1
    if (character === ')') {
      if (depth === 0) break
      depth -= 1
    }
    if (/\s/.test(character) && depth === 0) break
    end += 1
  }

  return depth === 0 ? { start, end } : null
}

function normalizeReferenceLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase()
}

function markdownTokens(line, state) {
  const openingFence =
    !state.fence && !state.inComment
      ? line.match(/^\s{0,3}(`{3,}|~{3,})/)
      : null
  if (openingFence) {
    state.fence = {
      character: openingFence[1][0],
      length: openingFence[1].length,
    }
    return { spans: [], definitions: [], uses: [] }
  }

  if (state.fence) {
    const closingFence = line.match(/^\s{0,3}(`+|~+)\s*$/)
    if (
      closingFence &&
      closingFence[1][0] === state.fence.character &&
      closingFence[1].length >= state.fence.length
    ) {
      state.fence = null
    }
    return { spans: [], definitions: [], uses: [] }
  }

  const protectedContent = protectedRanges(line, state)
  const spans = []
  const definitions = []
  const uses = []

  const reference = line.match(/^\s{0,3}\[(?!\^)([^\]]+)\]:\s*/)
  if (reference && !isProtected(reference.index ?? 0, protectedContent)) {
    const span = destinationSpan(line, reference[0].length)
    if (span && !isProtected(span.start, protectedContent)) {
      spans.push(span)
      definitions.push(normalizeReferenceLabel(reference[1]))
    }
  }

  let cursor = 0
  while (cursor < line.length) {
    const opening = line.indexOf('](', cursor)
    if (opening === -1) break
    if (isProtected(opening, protectedContent) || isEscaped(line, opening)) {
      cursor = opening + 2
      continue
    }

    const labelStart = line.lastIndexOf('[', opening)
    if (
      labelStart === -1 ||
      isProtected(labelStart, protectedContent) ||
      isEscaped(line, labelStart)
    ) {
      cursor = opening + 2
      continue
    }

    const span = destinationSpan(line, opening + 2)
    if (!span || isProtected(span.start, protectedContent)) {
      cursor = opening + 2
      continue
    }

    const hasClosingParenthesis = line.indexOf(')', span.end) !== -1
    if (
      hasClosingParenthesis &&
      !spans.some((existing) => existing.start === span.start)
    ) {
      spans.push(span)
    }
    cursor = Math.max(span.end, opening + 2)
  }

  for (const match of line.matchAll(/!?\[([^\]]+)\]\[([^\]]*)\]/g)) {
    const labelStart = line.indexOf('[', match.index)
    if (
      match[1].startsWith('^') ||
      isProtected(labelStart, protectedContent) ||
      isEscaped(line, labelStart)
    ) {
      continue
    }
    uses.push(normalizeReferenceLabel(match[2] || match[1]))
  }

  return {
    spans: spans.sort((left, right) => left.start - right.start),
    definitions,
    uses,
  }
}

export function transformMarkdownLinkTargets(content, transform) {
  const state = { fence: null, inComment: false }

  return content
    .split('\n')
    .map((line, lineIndex) => {
      const { spans } = markdownTokens(line, state)
      let output = line
      for (const span of spans.reverse()) {
        const target = line.slice(span.start, span.end)
        output = `${output.slice(0, span.start)}${transform(target, lineIndex + 1)}${output.slice(span.end)}`
      }
      return output
    })
    .join('\n')
}

export function collectMarkdownLinkTargets(content) {
  const targets = []
  transformMarkdownLinkTargets(content, (target, line) => {
    targets.push({ target, line })
    return target
  })
  return targets
}

export function collectMarkdownReferences(content) {
  const state = { fence: null, inComment: false }
  const definitions = []
  const uses = []

  content.split('\n').forEach((line, lineIndex) => {
    const tokens = markdownTokens(line, state)
    definitions.push(
      ...tokens.definitions.map((label) => ({ label, line: lineIndex + 1 })),
    )
    uses.push(...tokens.uses.map((label) => ({ label, line: lineIndex + 1 })))
  })

  return { definitions, uses }
}
