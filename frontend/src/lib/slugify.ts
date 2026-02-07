export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function programPath(universityName: string, programName: string): string {
  return `/${slugify(universityName)}/${slugify(programName)}`;
}
