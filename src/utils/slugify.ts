export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

export const generateUniqueSlug = async (
  baseSlug: string,
  checkExistence: (slug: string) => Promise<boolean>,
  maxAttempts: number = 100
): Promise<string> => {
  let slug = baseSlug
  let counter = 1

  while (await checkExistence(slug) && counter <= maxAttempts) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  if (counter > maxAttempts) {
    // Fallback to timestamp if we can't find a unique slug
    slug = `${baseSlug}-${Date.now()}`
  }

  return slug
}
