export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function extractParameterNames(sqlText: string): string[] {
  const names = new Set<string>();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sqlText))) {
    names.add(match[1].trim());
  }
  return Array.from(names);
}
