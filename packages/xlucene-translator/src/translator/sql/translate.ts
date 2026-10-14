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

function buildExistsSQL(node: Exists, context: SQLContext): string {
    return context.dialect.exists(context.dialect.fieldRef(node.field));
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

    if (isTerm(node)) return buildTermSQL(node, fieldExpr, context);
    if (isRegexp(node)) return buildRegexpSQL(node, fieldExpr, context);
    if (isWildcard(node)) return buildWildcardSQL(node, fieldExpr, context);
    if (isRange(node)) return buildRangeSQL(node, fieldExpr, context);

    return undefined;
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

/**
 * The same term against many fields, each compared using its own type.
 *
 * A field whose type cannot hold the value is left out, because `"num" = 'hello'` is a cast
 * error that fails the whole query. Such a field could not match anyway, so the result is
 * the same as in Elasticsearch.
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

    return dialect.equals(fieldExpr, value, node.field_type);
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
