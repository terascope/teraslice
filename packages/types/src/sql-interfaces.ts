import * as geo from './geo-interfaces.js';
import { SortOrder } from './elasticsearch-interfaces.js';
import { xLuceneFieldType } from './xlucene-interfaces.js';

/**
 * The SQL engines an xLucene query can be translated for.
 *
 * The differences between them are real and concentrated in a few places - geo predicates,
 * IP containment, JSON access and regular expressions - which is why translation goes
 * through a {@link SQLDialect} rather than emitting one string for everyone.
*/
export enum SQLDialectName {
    duckdb = 'duckdb',
    postgres = 'postgres',
}

/**
 * One end of a queried address range.
 *
 * **The inclusivity is not decoration.** `[a TO b]` and `{a TO b}` are different questions
 * of an `ip_range` column: the first overlaps a block that merely touches `b`, the second
 * does not. An overlap test makes no such distinction for itself, so the bound carries it.
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
 * It is spelled out on every emitted term rather than left to the engine, because no two
 * engines agree and none of them match `DataFrame` - see `defaultNullOrder` in
 * `@terascope/sql-builder`.
*/
export type SQLNullOrder = 'first' | 'last';

/**
 * A SQL `ORDER BY` entry.
 *
 * **This is the only sort shape.** The xLucene translator produces it, `SQLSearchParams`
 * carries it, and `data-mate`'s DuckDB frame consumes it, so a translated sort can be handed
 * to a frame without being reshaped on the way.
*/
export interface SQLSort {
    /**
     * Already-quoted SQL, so it may be a bare column or a function call - a geo-distance
     * sort is the latter.
     *
     * **This is not escaped and cannot be**, for the same reason
     * {@link SQLSearchParams.relation} is not: it is the caller's own SQL, and it must never
     * be built from input the caller did not write. A field name coming from a request wants
     * `dialect.fieldRef(field)` around it first.
    */
    expression: string;
    /**
     * The direction, which is checked rather than interpolated - the one half of an
     * `ORDER BY` entry that arrives from a request as a value rather than as SQL.
     *
     * **Required, including here where a default would be harmless-looking.** A missing
     * direction is refused rather than assumed ascending, because this shape is built from
     * request data: a sort that arrives without one is a caller bug, and answering it with a
     * guess returns a plausible page in the wrong order. A frame whose own API defaults to
     * ascending applies that default before it builds one of these - see `SQLSortInput` in
     * `@terascope/sql-builder`.
    */
    order: SortOrder;
    /**
     * Where nulls go, defaulting to `DataFrame`'s rule - FIRST ascending, LAST descending.
     *
     * Set it to `'last'` in both directions for the Elasticsearch answer.
    */
    nulls?: SQLNullOrder;
}

/**
 * The SQL analogue of `ClientParams.SearchParams` - everything a complete statement needs
 * beyond the query itself.
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
     * A relation expression used VERBATIM, for a source no identifier can name:
     * `read_parquet(['s3://bucket/a.parquet'])`, a sub-select, a join.
     *
     * **This is not escaped and cannot be.** It is the caller's own SQL, and it must never be
     * built from input the caller did not write. Use `table` for anything that is a name.
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
     * **Each entry's `expression` is used verbatim** - see {@link SQLSort.expression}.
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
 * `query` is a boolean expression suitable for a `WHERE` clause or any predicate-taking
 * API - it is NOT a complete statement, because the caller owns the projection and the
 * source. An empty xLucene query becomes `TRUE`, and a query that cannot match anything
 * becomes `FALSE`.
*/
export interface SQLResult {
    query: string;
    /**
     * Present only when the query asked for an ordering - today a `geoDistance` function,
     * or a `default_geo_field` with a `geo_sort_point`.
    */
    sort?: SQLSort[];
}

/**
 * Options for translating an xLucene query to SQL.
 *
 * Mirrors {@link ElasticsearchDSLOptions}: the engine-specific knobs live on the dialect,
 * and the geo sort options behave exactly as they do for the Elasticsearch DSL.
*/
export interface xLuceneSQLOptions {
    /**
     * The SQL engine to emit for, either by name or as a complete dialect.
     *
     * Passing an object lets a caller override individual methods of a built-in dialect
     * without a new one being added here.
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
 * How a `geo-point` field is stored in the target engine, which decides how a
 * latitude or longitude is read back out of it.
*/
export interface SQLGeoPointColumn {
    lat: string;
    lon: string;
}

/**
 * Every piece of SQL that differs between engines.
 *
 * A dialect never walks the AST - the translator does that - it only renders the leaves and
 * the boolean glue. That split is what keeps `postgres` from re-implementing the language
 * and what lets a caller override one method without forking the walk.
 *
 * **Every predicate returned must be safe to inline into a larger expression**, so anything
 * with operator precedence returns itself parenthesized.
*/
export interface SQLDialect {
    readonly name: string;

    /** Quote an identifier for use as a column reference. */
    quoteIdentifier(name: string): string;

    /**
     * The column expression for an xLucene field path.
     *
     * A dotted xLucene field is ambiguous - it may be a column named `a.b` or a member `b`
     * of a struct column `a` - and which one it is depends on how the engine stores nested
     * data, so each dialect answers for itself.
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
     * This is where a field restriction is ENFORCED: Elasticsearch withholds a field because
     * the request carries `_source_excludes` and the server obeys it, and the projection is
     * the only thing in SQL that can do the same job.
     *
     * `readable` is the field paths that may be returned and `all` is every path the type
     * config declares - a dialect needs both to tell a whole column from one only part of
     * which may be read. An empty `readable` means nothing may be returned, which is a row
     * with no data rather than no row.
    */
    projection(readable: readonly string[], all: readonly string[]): string;

    /**
     * The row-limiting clause, or an empty string when neither bound is set.
     *
     * DuckDB and PostgreSQL both spell it `LIMIT n OFFSET m`, but plenty of engines do not -
     * SQL Server and older Oracle want `OFFSET … FETCH` - so it belongs on the dialect rather
     * than in the statement builder.
    */
    limitOffset(size?: number, offset?: number): string;

    /**
     * The `ORDER BY` terms, without the keyword, or `''` for no ordering.
     *
     * **Direction AND null placement are always emitted**, never left to the engine: no two
     * engines place nulls the same way and none of them match `DataFrame`. An engine with no
     * `NULLS FIRST`/`NULLS LAST` syntax overrides this and emits whatever it needs instead.
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
     * **This is not a bare `NOT`.** Elasticsearch's `must_not` matches a document whose field
     * is missing, while SQL's three-valued logic drops a row whose predicate is `NULL`, so a
     * dialect has to force the unknown case back to true.
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

    /** A `geo-point` field within `distance` metres of a point. */
    geoPointWithinDistance(
        fieldExpr: string, point: geo.GeoPoint, metres: number
    ): string;

    /** The distance in metres from a `geo-point` field to a point, for sorting. */
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
