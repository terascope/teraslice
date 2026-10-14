import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { DataType } from '@terascope/data-types';
import { SQLSort } from '@terascope/types';
import { getSQLDialect } from '../../src/index.js';

/**
 * A real DuckDB database for the SQL translation tests.
 *
 * These tests check that the generated SQL runs and returns the right rows. A plausible
 * predicate can still be a cast error, a boundary off by one, or a `NOT` that drops every row
 * whose field is missing, and a string comparison shows none of that.
*/
export class DuckTestDB {
    private constructor(
        private readonly instance: DuckDBInstance,
        private readonly connection: DuckDBConnection
    ) {}

    /**
     * An in-memory database with the `inet` and `spatial` extensions loaded.
     *
     * Neither is statically linked. `inet` autoloads on first use but `spatial` does not, so
     * both are loaded up front and a missing one fails clearly at setup.
    */
    static async create(): Promise<DuckTestDB> {
        const instance = await DuckDBInstance.create(':memory:');
        const connection = await instance.connect();

        await connection.run('INSTALL inet');
        await connection.run('LOAD inet');
        await connection.run('INSTALL spatial');
        await connection.run('LOAD spatial');

        return new DuckTestDB(instance, connection);
    }

    async createTable(
        table: string,
        dataType: DataType,
        records: readonly Record<string, any>[]
    ): Promise<void> {
        const columns = Object.entries(dataType.toDuckDB())
            .map(([name, type]) => `${quoteIdentifier(name)} ${type}`)
            .join(', ');

        await this.connection.run(`CREATE TABLE ${quoteIdentifier(table)} (${columns})`);

        const types = dataType.toDuckDB();
        const fields = Object.keys(types);

        for (const record of records) {
            const values = fields
                .map((field) => columnValue(types[field], record[field]))
                .join(', ');
            await this.connection.run(
                `INSERT INTO ${quoteIdentifier(table)} VALUES (${values})`
            );
        }
    }

    /**
     * Runs a complete statement exactly as given.
     *
     * Nothing is added here on purpose: `restrictSQLQuery` must return something a client can
     * execute as-is.
    */
    async run(sql: string): Promise<Record<string, any>[]> {
        const result = await this.connection.runAndReadAll(sql);

        return result.getRowObjects().map((row) => toJSValue(row) as Record<string, any>);
    }

    /**
     * The rows a projection and a predicate produce, as plain JSON values.
     *
     * The projection is a parameter instead of a fixed `*` so tests can check that a field
     * restriction reaches the statement.
    */
    async select(
        table: string,
        projection: string,
        predicate: string,
        sort?: SQLSort[]
    ): Promise<Record<string, any>[]> {
        // the dialect renders the clause, so it matches a real statement, including the
        // explicit NULLS placement
        const terms = getSQLDialect().orderBy(sort);
        const orderBy = terms ? ` ORDER BY ${terms}` : '';

        return this.run(
            `SELECT ${projection} FROM ${quoteIdentifier(table)} WHERE ${predicate}${orderBy}`
        );
    }

    /** Every column of every row the predicate matches. */
    async search(
        table: string,
        predicate: string,
        sort?: SQLSort[]
    ): Promise<Record<string, any>[]> {
        return this.select(table, '*', predicate, sort);
    }

    /** The `id` of every matching row, which is what most assertions are about. */
    async searchIds(table: string, predicate: string, sort?: SQLSort[]): Promise<string[]> {
        const rows = await this.search(table, predicate, sort);
        return rows.map((row) => row.id as string);
    }

    async close(): Promise<void> {
        this.connection.closeSync();
        this.instance.closeSync();
    }
}

function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

/**
 * A literal for one column. A `geo-json` column is a `GEOMETRY`, and DuckDB casts text to one
 * only from WKT, so a GeoJSON document goes through `ST_GeomFromGeoJSON`. That gives the same
 * value TealFrame's ingest produces.
*/
function columnValue(type: string, value: unknown): string {
    if (value != null && type === 'GEOMETRY') return `ST_GeomFromGeoJSON(${toSQLValue(value)})`;
    // a date is `{ ms, tz_offset }` - epoch millis and no display offset
    if (value != null && type.startsWith('STRUCT(ms BIGINT')) {
        return `{'ms': ${new Date(value as string).getTime()}, 'tz_offset': NULL::SMALLINT}`;
    }
    return toSQLValue(value);
}

/**
 * A JavaScript value as a DuckDB literal, based on the value instead of the column type.
 *
 * DuckDB casts on insert, so a quoted ISO string fits a `TIMESTAMP` and a quoted JSON document
 * fits a `JSON` column. Only a struct (a `geo-point` or a nested object) must be written out
 * as one.
*/
function toSQLValue(value: unknown): string {
    if (value == null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return `${value}`;
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (Array.isArray(value)) return `[${value.map(toSQLValue).join(', ')}]`;

    if (typeof value === 'object') {
        const members = Object.entries(value as Record<string, unknown>)
            .map(([key, member]) => `'${key}': ${toSQLValue(member)}`)
            .join(', ');
        return `{${members}}`;
    }

    return `'${String(value).replace(/'/g, '\'\'')}'`;
}

/**
 * A DuckDB value as the JavaScript value it represents.
 *
 * `getRowObjectsJson` would do most of this, but it renders a `BIGINT` as a string, which
 * would not equal the number Elasticsearch returns for the same record.
*/
function toJSValue(value: unknown): unknown {
    if (typeof value === 'bigint') return Number(value);
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(toJSValue);

    const duck = value as { entries?: Record<string, unknown>; micros?: bigint };

    if (duck.micros != null) return new Date(Number(duck.micros / 1000n)).toISOString();
    // a date, `{ ms, tz_offset }`, as the ISO string Elasticsearch returns
    if (duck.entries != null && 'tz_offset' in duck.entries && 'ms' in duck.entries) {
        return new Date(Number(duck.entries.ms)).toISOString();
    }

    // a STRUCT keeps its members under `entries` and a row is a plain object; both need
    // every member converted
    const members = duck.entries ?? (value as Record<string, unknown>);

    return Object.fromEntries(
        Object.entries(members).map(([key, member]) => [key, toJSValue(member)])
    );
}
