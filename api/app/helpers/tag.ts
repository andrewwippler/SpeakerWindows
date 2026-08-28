import Tag from "#models/tag"

export default function TagSlugSanitizer(slug: string) {
  return slug
    .replace(/[^A-Za-z0-9\- ]/g, '')
    .replace(/ /g, '-')
    .toLowerCase()
}
export function displayName(name: string): string {
  return name.replace(/-/g, ' ')
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