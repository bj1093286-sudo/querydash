const PARAM_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export type PlaceholderStyle = 'dollar' | 'question';

export interface ParsedParameterQuery {
  text: string;
  values: unknown[];
  parameterNames: string[];
}

/**
 * Replaces {{param}} placeholders with driver-native bound-parameter
 * placeholders ($1, $2, ... or ?) so raw values are never interpolated
 * into the SQL string, preventing SQL injection via parameters.
 */
export function parseParameters(
  sqlText: string,
  values: Record<string, unknown>,
  style: PlaceholderStyle = 'dollar'
): ParsedParameterQuery {
  const parameterNames = new Set<string>();
  const outputValues: unknown[] = [];
  const nameToDollarIndex = new Map<string, number>();

  const text = sqlText.replace(PARAM_PATTERN, (_match, rawName: string) => {
    const name = rawName.trim();
    parameterNames.add(name);

    if (style === 'dollar') {
      if (!nameToDollarIndex.has(name)) {
        outputValues.push(values[name]);
        nameToDollarIndex.set(name, outputValues.length);
      }
      return `$${nameToDollarIndex.get(name)}`;
    }

    outputValues.push(values[name]);
    return '?';
  });

  return { text, values: outputValues, parameterNames: Array.from(parameterNames) };
}

export function extractParameterNames(sqlText: string): string[] {
  const names = new Set<string>();
  const re = new RegExp(PARAM_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = re.exec(sqlText))) {
    names.add(match[1].trim());
  }
  return Array.from(names);
}
