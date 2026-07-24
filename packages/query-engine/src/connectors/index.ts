import type { DataSource } from '@querydash/types';
import type { Connector } from './base';
import { PostgreSQLConnector } from './postgresql';
import { MySQLConnector } from './mysql';

export * from './base';
export * from './postgresql';
export * from './mysql';

export function createConnector(datasource: DataSource): Connector {
  switch (datasource.type) {
    case 'postgresql':
      return new PostgreSQLConnector(datasource.connectionOptions);
    case 'mysql':
      return new MySQLConnector(datasource.connectionOptions);
    default:
      throw new Error(`지원하지 않는 데이터소스 타입입니다: ${datasource.type}`);
  }
}
