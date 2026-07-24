import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import type { DatabaseSchema } from '@querydash/types';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT',
  'INSERT INTO', 'UPDATE', 'DELETE FROM', 'VALUES', 'SET', 'DISTINCT', 'UNION', 'ALL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IS', 'NULL', 'IN', 'BETWEEN', 'LIKE', 'EXISTS', 'WITH',
];

function schemaToCompletions(schema?: DatabaseSchema): Completion[] {
  if (!schema) return [];
  const completions: Completion[] = [];
  for (const table of schema.tables) {
    completions.push({ label: table.name, type: 'class', detail: table.schema ?? 'table' });
    for (const column of table.columns) {
      completions.push({
        label: column.name,
        type: 'property',
        detail: `${table.name} · ${column.type}`,
      });
    }
  }
  return completions;
}

export function createSchemaCompletionSource(schema?: DatabaseSchema) {
  const schemaCompletions = schemaToCompletions(schema);
  const keywordCompletions: Completion[] = SQL_KEYWORDS.map((kw) => ({
    label: kw,
    type: 'keyword',
    boost: -1,
  }));
  const all = [...schemaCompletions, ...keywordCompletions];

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: all,
      validFor: /^[\w.]*$/,
    };
  };
}
