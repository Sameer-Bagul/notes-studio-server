export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniqueSlug = async (baseSlug, checkExistence, maxAttempts = 100) => {
  let slug = baseSlug;
  let counter = 1;
  while (await checkExistence(slug) && counter <= maxAttempts) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  if (counter > maxAttempts) {
    slug = `${baseSlug}-${Date.now()}`;
  }
  return slug;
};
