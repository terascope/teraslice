import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { DataType } from '@terascope/data-types';
import { SQLSort } from '@terascope/types';
import { getSQLDialect } from '../../src/translator/sql/index.js';

/**
 * A real DuckDB database for the SQL translation tests.
 *
 * **The point of these tests is that the emitted SQL RUNS**, not that it reads correctly.
 * A predicate can be perfectly plausible and still be a cast error, a boundary off by one,
 * or - the failure that started this - a `NOT` that drops every row whose field is missing.
 * None of that is visible in a string comparison.
*/
export class DuckTestDB {
    private constructor(
        private readonly instance: DuckDBInstance,
        private readonly connection: DuckDBConnection
    ) {}

    /**
     * An in-memory database with both extensions loaded.
     *
     * **Neither is statically linked.** `inet` would autoload on first use but `spatial` does
     * NOT, and a geo query without it fails with a catalog error rather than a wrong answer -
     * so both are loaded up front, where a missing one is a clear failure at setup.
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

        const fields = Object.keys(dataType.toDuckDB());

        for (const record of records) {
            const values = fields.map((field) => toSQLValue(record[field])).join(', ');
            await this.connection.run(
                `INSERT INTO ${quoteIdentifier(table)} VALUES (${values})`
            );
        }
    }

    /**
     * Run a complete statement, exactly as it was handed over.
     *
     * **Nothing is added to it here, and that is the test.** `restrictSQLQuery` returns
     * something a client can execute; if a spec had to wrap it in anything, that wrapping
     * would be the part nobody wrote in production.
    */
    async run(sql: string): Promise<Record<string, any>[]> {
        const result = await this.connection.runAndReadAll(sql);

        return result.getRowObjects().map((row) => toJSValue(row) as Record<string, any>);
    }

    /**
     * The rows a projection and a predicate produce, as plain JSON values.
     *
     * The projection is a parameter rather than a fixed `*` because a field restriction is
     * only real if it reaches the statement - a test that always selected everything could
     * not tell an applied restriction from a reported one.
    */
    async select(
        table: string,
        projection: string,
        predicate: string,
        sort?: SQLSort[]
    ): Promise<Record<string, any>[]> {
        // the dialect renders it, so what runs here is what a real statement would carry -
        // including the explicit NULLS placement, which a hand-rolled clause would omit
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
 * A JavaScript value as a DuckDB literal, driven by the VALUE rather than the column type.
 *
 * DuckDB casts on insert, so a quoted ISO string lands in a `TIMESTAMP` and a quoted JSON
 * document lands in a `JSON` column; only a struct has to be written out as one, which is
 * what a `geo-point` and a nested object both are.
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
 * A DuckDB value as the JavaScript one it stands for.
 *
 * `getRowObjectsJson` would do most of this, but it renders a `BIGINT` as a STRING - which
 * would make an integer column compare unequal to the number Elasticsearch returns for the
 * same record, and the parity test would be measuring the driver rather than the query.
*/
function toJSValue(value: unknown): unknown {
    if (typeof value === 'bigint') return Number(value);
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(toJSValue);

    const duck = value as { entries?: Record<string, unknown>; micros?: bigint };

    if (duck.micros != null) return new Date(Number(duck.micros / 1000n)).toISOString();

    // a STRUCT keeps its members under `entries`; a row is already a plain object, and both
    // need every member converted, so the only difference is where the members are
    const members = duck.entries ?? (value as Record<string, unknown>);

    return Object.fromEntries(
        Object.entries(members).map(([key, member]) => [key, toJSValue(member)])
    );
}
