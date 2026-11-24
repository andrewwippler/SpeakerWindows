import type Tag from '#models/tag'
import type Illustration from '#models/illustration'

export default function TagSlugSanitizer(slug: string) {
  return slug
    .replace(/[^A-Za-z0-9\- ]/g, '')
    .replace(/ /g, '-')
    .toLowerCase()
}
export function displayName(name: string): string {
  return name.replace(/-/g, ' ')
}

export function dedupeTags(tags: Tag[]): Tag[] {
  const uniqueTags = new Map<string, Tag>()

  for (const tag of tags) {
    const key = tag.name.trim().toLowerCase()
    const existing = uniqueTags.get(key)

    if (!existing || isPreferredTag(tag, existing)) {
      uniqueTags.set(key, tag)
    }
  }

  return Array.from(uniqueTags.values())
}

function isPreferredTag(candidate: Tag, existing: Tag): boolean {
  const candidateIsTeamTag = candidate.team_id !== null
  const existingIsTeamTag = existing.team_id !== null

  if (candidateIsTeamTag !== existingIsTeamTag) {
    return candidateIsTeamTag
  }

  return candidate.id < existing.id
}

export function buildColumns(tags: Tag[]): Tag[][] {
  if (tags.length === 0) return []
  const rowsPerColumn = Math.ceil(tags.length / 3)
  return [
    tags.slice(0, rowsPerColumn),
    tags.slice(rowsPerColumn, rowsPerColumn * 2),
    tags.slice(rowsPerColumn * 2),
  ]
}

export function buildAuthorColumns(authors: Illustration[]): Illustration[][] {
  if (authors.length === 0) return []
  const rowsPerColumn = Math.ceil(authors.length / 3)
  return [
    authors.slice(0, rowsPerColumn),
    authors.slice(rowsPerColumn, rowsPerColumn * 2),
    authors.slice(rowsPerColumn * 2),
  ]
}
