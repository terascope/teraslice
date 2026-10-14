import * as geo from './geo-interfaces.js';
import { SortOrder } from './elasticsearch-interfaces.js';
import { xLuceneFieldType } from './xlucene-interfaces.js';

/**
 * The SQL engines an xLucene query can be translated for.
 *
 * The engines differ mainly in geo predicates, IP handling and regular expressions, so
 * translation goes through a {@link SQLDialect}.
*/
export enum SQLDialectName {
    duckdb = 'duckdb',
    postgres = 'postgres',
}

/**
 * One end of a queried address range.
 *
 * `inclusive` matters for `ip_range` columns: `[a TO b]` matches a block that only touches
 * `b`, and `{a TO b}` does not.
*/
export interface SQLIPRangeBound {
    /** The address at that end of the range. */
    value: string;
    /** Whether that address is itself part of the range. */
    inclusive: boolean;
}

/**
 * Where nulls are placed within a sorted column.
 *
 * It is written on every `ORDER BY` term, because engine defaults differ and none match
 * `DataFrame`. See `defaultNullOrder` in `@terascope/sql-builder`.
*/
export type SQLNullOrder = 'first' | 'last';

/**
 * A SQL `ORDER BY` entry.
 *
 * The xLucene translator produces it, `SQLSearchParams` carries it and `data-mate`'s DuckDB
 * frame accepts it, so a translated sort can be passed to a frame unchanged.
*/
export interface SQLSort {
    /**
     * A SQL expression, already quoted: a column reference or a function call (a
     * geo-distance sort is a function call).
     *
     * **It is used as-is, without escaping**, so never build it from untrusted input. Wrap a
     * field name from a request with `dialect.fieldRef(field)` first.
    */
    expression: string;
    /**
     * The sort direction. It is validated before it is written into the statement.
     *
     * Required, because this shape is built from request data and a missing direction is a
     * caller bug. Code that wants an ascending default can use `SQLSortInput` and
     * `toSQLSort` from `@terascope/sql-builder`.
    */
    order: SortOrder;
    /**
     * Where nulls go. Defaults to `DataFrame`'s rule: first when ascending, last when
     * descending. Set it to `'last'` to match Elasticsearch.
    */
    nulls?: SQLNullOrder;
}

/**
 * The SQL counterpart of `ClientParams.SearchParams`: everything a complete statement needs
 * besides the query itself.
 *
 * | Elasticsearch | here |
 * |---|---|
 * | `index` | `table`, or `relation` for an expression |
 * | `size` | `LIMIT` |
 * | `from` | `OFFSET` |
 * | `sort` | extra `ORDER BY` entries |
 * | `_source_includes` / `_source_excludes` | `includes` / `excludes`, into the `SELECT` list |
*/
export interface SQLSearchParams {
    /**
     * The table to select from, quoted as an identifier.
     *
     * A dot separates catalog, schema and table - `main.public.events` becomes
     * `"main"."public"."events"` - so a name is never taken as raw SQL.
    */
    table?: string;
    /**
     * A SQL source expression used as-is, for sources that are not a plain table name, such
     * as `read_parquet(['s3://bucket/a.parquet'])`, a subquery or a join.
     *
     * **It is not escaped**, so never build it from untrusted input. Use `table` for a name.
    */
    relation?: string;
    /** Row limit. Must be a non-negative integer. */
    size?: number;
    /** Rows to skip. Must be a non-negative integer. */
    from?: number;
    /**
     * Ordering, appended to whatever the query itself asked for.
     *
     * A `geoDistance` query produces its own sort; when it does, it comes first.
     *
     * Each entry's `expression` is used as-is; see {@link SQLSort.expression}.
    */
    sort?: SQLSort[];
    /** Fields the caller wants, filtered by what the configuration permits. */
    includes?: string[];
    /** Fields the caller wants left out, combined with the configured excludes. */
    excludes?: string[];
}

/**
 * The result of translating an xLucene query to SQL.
 *
 * `query` is a boolean expression for a `WHERE` clause, not a complete statement; the caller
 * supplies the projection and the source. An empty xLucene query becomes `TRUE`, and a query
 * that cannot match anything becomes `FALSE`.
*/
export interface SQLResult {
    query: string;
    /**
     * Present only when the query implies an ordering: a `geoDistance` function, or a
     * `default_geo_field` with a `geo_sort_point`.
    */
    sort?: SQLSort[];
}

/**
 * Options for translating an xLucene query to SQL.
 *
 * Mirrors {@link ElasticsearchDSLOptions}. Engine-specific behavior lives on the dialect, and
 * the geo sort options work as they do for the Elasticsearch DSL.
*/
export interface xLuceneSQLOptions {
    /**
     * The SQL engine to generate SQL for, as a name or a dialect object.
     *
     * Passing an object lets a caller override methods of a built-in dialect.
     *
     * @default SQLDialectName.duckdb
    */
    dialect?: SQLDialectName | SQLDialect;
    /**
     * If a default_geo_field is set, this is required to enable sorting
    */
    geo_sort_point?: geo.GeoPoint;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: geo.GeoDistanceUnit;
}

/**
 * SQL expressions that read the latitude and longitude out of a `geo-point` column.
*/
export interface SQLGeoPointColumn {
    lat: string;
    lon: string;
}

/**
 * The SQL that differs between engines.
 *
 * The translator walks the xLucene AST; a dialect only renders the leaves and combines them
 * with AND, OR and NOT. A caller can override one method without changing the translator.
 *
 * Every predicate returned must be safe to embed in a larger expression, so anything with
 * operator precedence is returned in parentheses.
*/
export interface SQLDialect {
    readonly name: string;

    /** Quote an identifier for use as a column reference. */
    quoteIdentifier(name: string): string;

    /**
     * The column expression for an xLucene field path.
     *
     * A dotted field can be a column named `a.b` or member `b` of a struct column `a`,
     * depending on how the engine stores nested data, so each dialect decides.
    */
    fieldRef(field: string): string;

    /** A SQL string literal, escaped for this engine. */
    stringLiteral(value: string): string;

    /** A value rendered as a literal of the given xLucene field type. */
    literal(value: unknown, fieldType?: xLuceneFieldType): string;

    /** The lat and lon members of a `geo-point` column. */
    geoPointParts(fieldExpr: string): SQLGeoPointColumn;

    /**
     * The `SELECT` list for the readable fields.
     *
     * This is where field restrictions are enforced, the SQL equivalent of Elasticsearch's
     * `_source_excludes`.
     *
     * `readable` is the field paths that may be returned, and `all` is every path the type
     * config declares; both are needed to tell a fully readable column from a partly
     * readable one. An empty `readable` still returns rows, but with no data.
    */
    projection(readable: readonly string[], all: readonly string[]): string;

    /**
     * The row-limiting clause, or an empty string when neither bound is set.
     *
     * DuckDB and PostgreSQL both use `LIMIT n OFFSET m`, but other engines use
     * `OFFSET … FETCH`, so this is part of the dialect.
    */
    limitOffset(size?: number, offset?: number): string;

    /**
     * The `ORDER BY` terms, without the keyword, or `''` for no ordering.
     *
     * Direction and null placement are always written, because engine defaults for null
     * placement differ and none match `DataFrame`. An engine without
     * `NULLS FIRST`/`NULLS LAST` syntax can override this.
    */
    orderBy(sort?: readonly SQLSort[]): string;

    /** `TRUE` - an empty query matches everything. */
    matchAll(): string;

    /** `FALSE` - a query that cannot match anything. */
    matchNone(): string;

    /** Equality against a single value. */
    equals(fieldExpr: string, value: unknown, fieldType?: xLuceneFieldType): string;

    /** One side of a range. */
    compare(
        fieldExpr: string,
        operator: 'gt' | 'gte' | 'lt' | 'lte',
        value: unknown,
        fieldType?: xLuceneFieldType
    ): string;

    /** A wildcard match, given an xLucene wildcard value (`*` and `?`). */
    wildcard(fieldExpr: string, value: string, fieldType?: xLuceneFieldType): string;

    /** An anchored regular expression match, as the Elasticsearch `regexp` query is. */
    regexp(fieldExpr: string, value: string, fieldType?: xLuceneFieldType): string;

    /** The field has a value. */
    exists(fieldExpr: string): string;

    /** The value cast to text, for a query with no field. */
    toText(fieldExpr: string): string;

    /**
     * Negation.
     *
     * Not a bare `NOT`: Elasticsearch's `must_not` matches a document whose field is missing,
     * but SQL drops a row whose predicate is NULL, so a NULL result must become TRUE.
    */
    not(expression: string): string;

    /** All of the expressions. */
    and(expressions: string[]): string;

    /** Any of the expressions. */
    or(expressions: string[]): string;

    /** An IP or CIDR value contained by the CIDR block of an `ip` field. */
    ipInCIDR(fieldExpr: string, cidr: string): string;

    /** An `ip` field equal to a single address, compared as addresses rather than as text. */
    ipEquals(fieldExpr: string, address: string): string;

    /** An `ip_range` field whose stored block contains the address or block. */
    ipRangeContains(fieldExpr: string, value: string): string;

    /**
     * An `ip_range` field whose stored block overlaps the queried address range.
     *
     * Either bound may be absent, meaning unbounded on that side.
    */
    ipRangeIntersects(
        fieldExpr: string, start?: SQLIPRangeBound, end?: SQLIPRangeBound
    ): string;

    /** A `geo-point` field within `distance` meters of a point. */
    geoPointWithinDistance(
        fieldExpr: string, point: geo.GeoPoint, meters: number
    ): string;

    /** The distance in meters from a `geo-point` field to a point, for sorting. */
    geoPointDistance(fieldExpr: string, point: geo.GeoPoint): string;

    /** A `geo-point` field inside an axis-aligned bounding box. */
    geoPointInBoundingBox(
        fieldExpr: string, topLeft: geo.GeoPoint, bottomRight: geo.GeoPoint
    ): string;

    /**
     * A geo field related to a shape.
     *
     * `isPointColumn` says whether the field holds a point or a shape, which decides how the
     * column becomes a geometry.
    */
    geoRelation(
        fieldExpr: string,
        shape: geo.GeoShape,
        relation: geo.GeoShapeRelation,
        isPointColumn: boolean
    ): string;

    /** A geo shape field that contains a point. */
    geoContainsPoint(
        fieldExpr: string, point: geo.GeoPoint, isPointColumn: boolean
    ): string;
}
