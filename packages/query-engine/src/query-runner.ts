import type { DataSource, QueryError, QueryResult, QueryResultColumn } from '@querydash/types';
import { createConnector } from './connectors';
import { extractParameterNames, parseParameters } from './parameter-parser';

export interface RunQueryOptions {
  sqlText: string;
  datasource: DataSource;
  parameterValues?: Record<string, unknown>;
  confirmed?: boolean;
  onPid?: (pid: number) => void;
}

export function findMissingParameters(sqlText: string, values: Record<string, unknown>): string[] {
  return extractParameterNames(sqlText).filter((name) => {
    const v = values[name];
    return v === undefined || v === null || v === '';
  });
}

export interface RunQueryOutcome {
  result?: QueryResult;
  error?: QueryError;
  requiresConfirmation?: boolean;
}

const DANGEROUS_STATEMENT_RE = /^\s*(DROP|DELETE|TRUNCATE|ALTER|UPDATE|INSERT|CREATE|GRANT|REVOKE)\b/i;
const READ_ONLY_ALLOWED_RE = /^\s*(SELECT|WITH)\b/i;

export class QueryValidationError extends Error {
  constructor(
    public readonly code: 'EMPTY_QUERY' | 'CONFIRMATION_REQUIRED' | 'READ_ONLY_VIOLATION',
    message: string
  ) {
    super(message);
  }
}

export function validateQuery(sqlText: string, datasource: DataSource, confirmed = false): void {
  const trimmed = sqlText.trim();
  if (!trimmed) {
    throw new QueryValidationError('EMPTY_QUERY', '쿼리가 비어 있습니다.');
  }
  if (datasource.readOnly && !READ_ONLY_ALLOWED_RE.test(trimmed)) {
    throw new QueryValidationError(
      'READ_ONLY_VIOLATION',
      '읽기 전용 데이터소스에서는 SELECT/WITH 쿼리만 허용됩니다.'
    );
  }
  if (DANGEROUS_STATEMENT_RE.test(trimmed) && !confirmed) {
    throw new QueryValidationError(
      'CONFIRMATION_REQUIRED',
      '이 쿼리는 데이터를 변경합니다. 계속하시려면 확인이 필요합니다.'
    );
  }
}

interface DriverError {
  code?: string;
  message?: string;
  position?: string | number;
}

function mapDriverError(error: DriverError, queryText: string): QueryError {
  const code = error.code;
  const message = error.message ?? 'Unknown database error';

  let mapped: QueryError['code'] = 'UNKNOWN';
  if (code === '42601' || code === 'ER_PARSE_ERROR') mapped = 'SYNTAX_ERROR';
  else if (code === '42501' || code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_TABLEACCESS_DENIED_ERROR') {
    mapped = 'PERMISSION_DENIED';
  } else if (code === '42P01' || code === '42703' || code === 'ER_NO_SUCH_TABLE' || code === 'ER_BAD_FIELD_ERROR') {
    mapped = 'NOT_FOUND';
  } else if (code === '57014' || code === 'ER_QUERY_INTERRUPTED') mapped = 'TIMEOUT';
  else if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === '08001' ||
    code === '08006' ||
    code === 'PROTOCOL_CONNECTION_LOST'
  ) {
    mapped = 'CONNECTION_ERROR';
  }

  let line: number | undefined;
  let column: number | undefined;
  if (error.position !== undefined) {
    const pos = Number(error.position);
    if (!Number.isNaN(pos)) {
      const upto = queryText.slice(0, Math.max(0, pos - 1));
      const lines = upto.split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
  }

  return { code: mapped, message, line, column };
}

function mapResultColumnType(type: string): QueryResultColumn['type'] {
  switch (type) {
    case 'integer':
    case 'float':
    case 'boolean':
    case 'date':
    case 'datetime':
      return type;
    default:
      return 'string';
  }
}

export async function runQuery(options: RunQueryOptions): Promise<RunQueryOutcome> {
  const { sqlText, datasource, parameterValues = {}, confirmed = false, onPid } = options;

  try {
    validateQuery(sqlText, datasource, confirmed);
  } catch (e) {
    if (e instanceof QueryValidationError) {
      if (e.code === 'CONFIRMATION_REQUIRED') {
        return { requiresConfirmation: true, error: { code: 'UNKNOWN', message: e.message } };
      }
      return { error: { code: 'PERMISSION_DENIED', message: e.message } };
    }
    throw e;
  }

  const missing = findMissingParameters(sqlText, parameterValues);
  if (missing.length > 0) {
    return {
      error: { code: 'UNKNOWN', message: `다음 파라미터 값이 필요합니다: ${missing.join(', ')}` },
    };
  }

  const { text, values } = parseParameters(sqlText, parameterValues, datasource.type === 'mysql' ? 'question' : 'dollar');
  const connector = createConnector(datasource);

  try {
    await connector.connect();
    const timeoutSeconds = datasource.queryTimeoutSeconds ?? 300;
    const execResult = await Promise.race([
      connector.execute(text, values, { onPid }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject({ code: '57014', message: '쿼리 실행 시간이 초과되었습니다.' }), timeoutSeconds * 1000);
      }),
    ]);

    const result: QueryResult = {
      id: '',
      queryId: '',
      columns: execResult.columns.map((c) => ({ name: c.name, type: mapResultColumnType(c.type) })),
      rows: execResult.rows,
      runtimeSeconds: execResult.runtimeSeconds,
      retrievedAt: new Date().toISOString(),
    };
    return { result };
  } catch (error) {
    return { error: mapDriverError(error as DriverError, text) };
  } finally {
    await connector.disconnect();
  }
}
