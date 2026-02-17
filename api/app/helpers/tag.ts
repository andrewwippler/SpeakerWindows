export default function TagSlugSanitizer(slug: string) {
  return slug
    .replace(/[^A-Za-z0-9\- ]/g, '')
    .replace(/ /g, '-')
    .toLowerCase()
}
