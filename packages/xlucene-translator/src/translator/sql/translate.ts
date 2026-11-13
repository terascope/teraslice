import {
    TSError, isEmpty, matchWildcard
} from '@terascope/core-utils';
import {
    isEmptyNode, isWildcardField, isTerm,
    parseRange, isRange, isRegexp,
    isWildcard, isFunctionNode, initFunction,
    getFieldValue, isGroupLike, isNegation,
    isExists, isTermType,
    type Parser, type TermLikeNode, type Exists,
    type GroupLikeNode, type Conjunction, type Negation,
    type Range, type Regexp, type Node, type Wildcard,
    type Term,
} from 'xlucene-parser';
import { isCIDR } from '@terascope/ip-utils';
import {
    SQLIPRangeBound, SQLResult, SQLSort, xLuceneFieldType
} from '@terascope/types';
import { canRenderValueAs } from '@terascope/sql-builder';
import { UtilsTranslateSQLOptions } from './interfaces.js';

interface SQLContext extends UtilsTranslateSQLOptions {
    sort: SQLSort[];
}

/**
 * Translate an xLucene query to a SQL boolean expression.
 *
 * It walks the AST the same way `translateQuery` does for the Elasticsearch DSL, with the
 * same rules for dropping a branch. Engine-specific SQL comes from `options.dialect`.
 *
 * The result is an expression for a `WHERE` clause, not a full statement.
*/
export function translateSQLQuery(
    parser: Parser,
    options: UtilsTranslateSQLOptions
): SQLResult {
    const context: SQLContext = { ...options, sort: [] };
    const { dialect } = context;

    let query: string;

    if (isEmptyNode(parser.ast)) {
        query = dialect.matchAll();
    } else {
        const expression = buildAnySQL(parser.ast, context);

        if (expression == null) {
            const error = new TSError(`Unexpected problem when translating xlucene query ${parser.query}`, {
                context: { ast: parser.ast },
            });

            options.logger.error(error);
        }

        // an unbuildable query matches nothing, rather than matching everything
        query = expression ?? dialect.matchNone();
    }

    const sort = resolveSort(context);

    return {
        query,
        ...(sort.length && { sort })
    };
}

/**
 * The ordering, which comes either from a `geoDistance` function or from the configured
 * default geo field.
 *
 * `geo_sort_unit` is ignored. The distance is always in meters, and changing the unit would
 * not change the order.
*/
function resolveSort(context: SQLContext): SQLSort[] {
    if (context.sort.length) return context.sort;

    const { default_geo_field: geoField, geo_sort_point: point, dialect } = context;

    if (!geoField || !point) return [];

    return [{
        expression: dialect.geoPointDistance(dialect.fieldRef(geoField), point),
        order: context.geo_sort_order,
    }];
}

function buildAnySQL(node: Node, context: SQLContext): string | undefined {
    // a bare `*` with no field asks for everything
    if (
        isWildcard(node)
        && !node.field
        && getFieldValue(node.value, context.variables) === '*'
    ) {
        return context.dialect.matchAll();
    }

    if (isGroupLike(node)) return buildGroupSQL(node, context);
    if (isNegation(node)) return buildNegationSQL(node, context);
    if (isExists(node)) return buildExistsSQL(node, context);
    if (isTermType(node)) return buildTermLevelSQL(node, context);

    return undefined;
}

function buildGroupSQL(node: GroupLikeNode, context: SQLContext): string | undefined {
    const expressions: string[] = [];

    for (const conjunction of node.flow) {
        const expression = buildConjunctionSQL(conjunction, context);
        if (expression != null) expressions.push(expression);
    }

    if (!expressions.length) return undefined;

    return context.dialect.or(expressions);
}

/**
 * Every node of a conjunction must translate, or the whole conjunction is dropped.
 *
 * This matches the Elasticsearch translation. A term whose variable resolved to nothing
 * produces no query, and an AND missing one side would match more rows than asked for.
*/
function buildConjunctionSQL(
    conjunction: Conjunction,
    context: SQLContext
): string | undefined {
    const expressions: string[] = [];

    for (const node of conjunction.nodes) {
        const expression = buildAnySQL(node, context);
        if (expression == null) return undefined;
        expressions.push(expression);
    }

    if (!expressions.length) return undefined;

    return context.dialect.and(expressions);
}

function buildNegationSQL(node: Negation, context: SQLContext): string | undefined {
    const expression = buildAnySQL(node.node, context);
    if (expression == null) return undefined;

    return context.dialect.not(expression);
}

/**
 * The field has a value. A list has one when any of its values is set, so an empty list is
 * missing, as in Elasticsearch.
*/
function buildExistsSQL(node: Exists, context: SQLContext): string {
    const { dialect } = context;
    const fieldExpr = dialect.fieldRef(node.field);

    if (context.array_fields?.has(node.field)) {
        return dialect.anyValue(fieldExpr, (valueExpr) => dialect.exists(valueExpr));
    }

    return dialect.exists(fieldExpr);
}

function buildTermLevelSQL(node: TermLikeNode, context: SQLContext): string | undefined {
    if (isWildcardField(node)) {
        return buildWildcardFieldSQL(node, context);
    }

    if (isFunctionNode(node)) {
        return buildFunctionSQL(node, context);
    }

    if (!node.field || node.field === '*') {
        return buildFieldlessSQL(node, context);
    }

    const fieldExpr = context.dialect.fieldRef(node.field);

    if (context.array_fields?.has(node.field)) {
        return buildListSQL(node, fieldExpr, context);
    }

    return buildValueSQL(node, fieldExpr, context);
}

/** One value of the field matches the node. */
function buildValueSQL(
    node: TermLikeNode,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    if (isTerm(node)) return buildTermSQL(node, fieldExpr, context);
    if (isRegexp(node)) return buildRegexpSQL(node, fieldExpr, context);
    if (isWildcard(node)) return buildWildcardSQL(node, fieldExpr, context);
    if (isRange(node)) return buildRangeSQL(node, fieldExpr, context);

    return undefined;
}

/**
 * A list field matches when any of its values does.
 *
 * Elasticsearch indexes each value of a list on its own, so `tags:a AND tags:b` matches a list
 * holding both, and `NOT tags:a` matches an empty list. The node is built once for one value,
 * and dropped when it cannot be, the same as for a single value.
*/
function buildListSQL(
    node: TermLikeNode,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    let built = false;
    const expression = context.dialect.anyValue(fieldExpr, (valueExpr) => {
        const value = buildValueSQL(node, valueExpr, context);
        built = value != null;
        return value ?? context.dialect.matchNone();
    });

    return built ? expression : undefined;
}

/**
 * A field pattern such as `fo*:bar` becomes the same query against every configured field
 * it matches, as in the Elasticsearch translation.
*/
function buildWildcardFieldSQL(node: TermLikeNode, context: SQLContext): string | undefined {
    if (isEmpty(context.type_config)) {
        throw new TSError(
            `Configuration for type_config needs to be provided with fields related to ${node.field}`,
            { statusCode: 400, context: { safe: true } }
        );
    }

    const fields = Object.keys(context.type_config)
        .filter((field) => matchWildcard(node.field as string, field));

    return expandAcrossFields(node, fields, context);
}

/**
 * A query with no field becomes the same test against every configured field, like
 * Elasticsearch's `multi_match`.
*/
function buildFieldlessSQL(node: TermLikeNode, context: SQLContext): string | undefined {
    if (isRange(node)) {
        throw new TSError('A range query must specify a field to be translated to SQL', {
            statusCode: 400,
            context: { safe: true }
        });
    }

    if (isEmpty(context.type_config)) {
        throw new TSError(
            'Configuration for type_config needs to be provided to translate a query with no field',
            { statusCode: 400, context: { safe: true } }
        );
    }

    return expandAcrossFields(node, Object.keys(context.type_config), context);
}

const GEO_TYPES: ReadonlySet<xLuceneFieldType> = new Set([
    xLuceneFieldType.Geo, xLuceneFieldType.GeoPoint, xLuceneFieldType.GeoJSON,
]);

/**
 * The same term against many fields, each compared using its own type.
 *
 * A field whose type cannot hold the value is left out, because `"num" = 'hello'` is a cast
 * error that fails the whole query. Such a field could not match anyway, so the result is
 * the same as in Elasticsearch. Geo fields are left out too, as `multi_match` leaves them out:
 * a word such as `Emu` would otherwise be read as a geohash.
*/
function expandAcrossFields(
    node: TermLikeNode,
    fields: string[],
    context: SQLContext
): string | undefined {
    const { type_config: typeConfig, dialect } = context;
    const value = getFieldValue(
        (node as Term | Wildcard | Regexp).value, context.variables, true
    );

    const expressions = fields
        // `multi_match` does not query a geo field, and a word is not a geohash
        .filter((field) => !GEO_TYPES.has(typeConfig[field]))
        .filter((field) => !isTerm(node) || canRenderValueAs(value, typeConfig[field]))
        .map((field) => buildTermLevelSQL(
            { ...node, field, field_type: typeConfig[field] } as TermLikeNode, context
        ))
        .filter((expression): expression is string => expression != null);

    if (!expressions.length) return undefined;

    return dialect.or(expressions);
}

function buildTermSQL(
    node: Term,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return undefined;

    const { dialect } = context;

    /**
     * A CIDR block on an `ip` field matches addresses inside the block, so it becomes a
     * containment check rather than an equality.
    */
    if (node.field_type === xLuceneFieldType.IP && isCIDR(value)) {
        return dialect.ipInCIDR(fieldExpr, `${value}`);
    }

    if (node.field_type === xLuceneFieldType.Date) {
        const unit = dateUnit(value);
        if (unit) {
            return dialect.and([
                dialect.compare(fieldExpr, 'gte', unit.start, node.field_type),
                dialect.compare(fieldExpr, 'lt', unit.end, node.field_type),
            ]);
        }
    }

    return dialect.equals(fieldExpr, value, node.field_type);
}

/**
 * A date written to the day, minute or second, in its own offset, without a fraction of a
 * second: `2020-01-15`, `2020-01-15T12:30`, `2020-01-15T12:30:45+05:00`.
 *
 * The parser turns a time to the hour into a full time and a year into a number before this
 * runs, and a month is not rounded, so those are left to an equality.
*/
const ROUNDED_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?)?$/;

const UNIT_MS = { day: 86_400_000, minute: 60_000, second: 1_000 } as const;

/**
 * The unit a date term matches, as Elasticsearch matches it: a term on a `date` field is a
 * range from the first to the last millisecond of the smallest unit the value names, so
 * `2020-01-15` is the whole day. Any other value is one point in time.
*/
function dateUnit(value: unknown): { start: string; end: string } | undefined {
    if (typeof value !== 'string') return undefined;

    const match = ROUNDED_DATE.exec(value);
    if (!match) return undefined;

    const [, year, month, day, hour, minute, second, offset] = match;
    const unit = hour == null ? 'day' : second == null ? 'minute' : 'second';
    const [h, m, sec] = [hour, minute, second].map((part) => Number(part ?? 0));
    const local = Date.UTC(Number(year), Number(month) - 1, Number(day), h, m, sec);
    const start = local - offsetMillis(offset);
    if (Number.isNaN(start)) return undefined;

    return {
        start: new Date(start).toISOString(),
        end: new Date(start + UNIT_MS[unit]).toISOString(),
    };
}

/** `+05:00` is 5 hours ahead of UTC; no offset, or `Z`, is UTC. */
function offsetMillis(offset: string | undefined): number {
    if (!offset || offset === 'Z') return 0;
    const sign = offset.startsWith('-') ? -1 : 1;
    const digits = offset.slice(1).replace(':', '');
    return sign * ((Number(digits.slice(0, 2)) * 60) + Number(digits.slice(2))) * 60_000;
}

function buildRegexpSQL(
    node: Regexp,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return undefined;

    return context.dialect.regexp(fieldExpr, `${value}`, node.field_type);
}

function buildWildcardSQL(
    node: Wildcard,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return undefined;

    return context.dialect.wildcard(fieldExpr, `${value}`, node.field_type);
}

/**
 * A range query, with a special case for `ip_range` fields.
 *
 * An `ip_range` column stores a block, and the parser has already turned a CIDR query on it
 * into an address range, so the check is whether the two overlap.
*/
function buildRangeSQL(
    node: Range,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    const { dialect } = context;
    const range = parseRange(node, context.variables, true);

    if (fieldTypeOf(node, context) === xLuceneFieldType.IPRange) {
        return dialect.ipRangeIntersects(
            fieldExpr,
            rangeBound(range.gte, range.gt),
            rangeBound(range.lte, range.lt)
        );
    }

    const expressions = (['gte', 'gt', 'lte', 'lt'] as const)
        .filter((operator) => range[operator] != null)
        .map((operator) => dialect.compare(
            fieldExpr, operator, range[operator], rangeFieldType(node, operator)
        ));

    // both bounds were infinite, so the range only asks that the field have a value
    if (!expressions.length) return dialect.exists(fieldExpr);

    return dialect.and(expressions);
}

/**
 * The type of the field a range is over.
 *
 * The type config is checked first, since it holds the declared type. A CIDR that the
 * parser rewrote into a range has `ip_range` on the node, but a range written in the query
 * has the type only on its bounds, so the left bound is the last fallback.
*/
function fieldTypeOf(node: Range, context: SQLContext): xLuceneFieldType | undefined {
    return context.type_config[node.field as string]
        ?? node.field_type
        ?? node.left?.field_type;
}

/**
 * One end of a queried address range, and whether the address itself is in it.
 *
 * An inclusive bound and an exclusive one never both appear on the same side, so the
 * inclusive one decides when it is there.
*/
function rangeBound(inclusive: unknown, exclusive: unknown): SQLIPRangeBound | undefined {
    if (inclusive != null) return { value: `${inclusive}`, inclusive: true };
    if (exclusive != null) return { value: `${exclusive}`, inclusive: false };
    return undefined;
}

/**
 * The type to render a bound as.
 *
 * The bound's own `field_type` is preferred because it is more specific: a `date` range's
 * bounds are dates even when the node reports a broader type.
*/
function rangeFieldType(
    node: Range,
    operator: 'gte' | 'gt' | 'lte' | 'lt'
): xLuceneFieldType | undefined {
    const side = node.left?.operator === operator ? node.left : node.right;
    return side?.field_type ?? node.field_type;
}

function buildFunctionSQL(node: TermLikeNode, context: SQLContext): string | undefined {
    const { variables, type_config: typeConfig, dialect } = context;
    const instance = initFunction({ node: node as any, variables, type_config: typeConfig });

    if (instance.toSQLQuery == null) {
        throw new TSError(`xLucene function "${(node as any).name}" cannot be translated to SQL`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    const { query, sort } = instance.toSQLQuery(node.field as string, {
        logger: context.logger,
        type_config: typeConfig,
        dialect,
        geo_sort_order: context.geo_sort_order,
        geo_sort_unit: context.geo_sort_unit,
    });

    if (sort != null) context.sort.push(sort);

    return query;
}
