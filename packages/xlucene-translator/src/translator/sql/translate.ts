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
    SQLResult, SQLSort, xLuceneFieldType
} from '@terascope/types';
import { canRenderValueAs } from './helpers.js';
import { UtilsTranslateSQLOptions } from './interfaces.js';

interface SQLContext extends UtilsTranslateSQLOptions {
    sort: SQLSort[];
}

/**
 * An xLucene query as a SQL boolean expression.
 *
 * This is the same walk `translateQuery` makes for the Elasticsearch DSL - same node types,
 * same order, same rules about when a branch is dropped - and everything an engine spells
 * for itself is reached through `options.dialect`.
 *
 * The result is an EXPRESSION, not a statement: the caller owns the projection and the
 * source, and hands this to a `WHERE` clause or to any predicate-taking API.
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
 * **`geo_sort_unit` has no effect on a SQL sort and is not an omission.** The distance is
 * always emitted in metres, and scaling every distance by the same factor cannot reorder
 * them - unlike Elasticsearch, where the unit is part of the value the sort reports back.
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
 * Every node of a conjunction has to translate or the whole conjunction is dropped.
 *
 * That is the Elasticsearch rule, not a shortcut: a term whose variable resolved to nothing
 * produces no query, and an AND missing one of its halves would match MORE than it was
 * asked to rather than less.
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
 * it matches, exactly as the Elasticsearch translation does.
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
 * A query with no field at all - Elasticsearch answers it with `multi_match`, which searches
 * every field - becomes the same test against every configured field.
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
 * The same term against many fields, each one typed as that field is.
 *
 * **A field whose type cannot hold the value is left out rather than compared.** SQL has no
 * `multi_match`, and the obvious substitute - comparing every column as text - is both
 * slower and less true: `"num" = 'hello'` is a cast error that fails the whole query, not a
 * row that does not match. A field that cannot hold the value cannot match it, so dropping
 * it gives the Elasticsearch answer and keeps every remaining comparison typed.
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
     * An `ip` field given a CIDR block asks which addresses fall INSIDE the block, which is
     * a containment and not an equality. Elasticsearch does this for itself because its `ip`
     * type understands CIDR; SQL has to be told.
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
 * A range, with the one special case an `ip_range` field is.
 *
 * An `ip_range` column stores a BLOCK, and the parser has already turned a CIDR query on one
 * into a range of addresses - so the question is whether the two overlap, not whether the
 * column compares against the bounds.
*/
function buildRangeSQL(
    node: Range,
    fieldExpr: string,
    context: SQLContext
): string | undefined {
    const { dialect } = context;
    const range = parseRange(node, context.variables, true);

    if (node.field_type === xLuceneFieldType.IPRange) {
        const start = range.gte ?? range.gt;
        const end = range.lte ?? range.lt;
        return dialect.ipRangeIntersects(
            fieldExpr,
            start == null ? undefined : `${start}`,
            end == null ? undefined : `${end}`
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
 * The type to render a bound as.
 *
 * The bound carries its own `field_type` and it is the more specific of the two: a `date`
 * range's bounds are dates even when the node itself reports something broader.
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

/** `ORDER BY` text for a translated sort, or nothing when the query asked for no order. */
export function toOrderBy(sort?: SQLSort[]): string | undefined {
    if (!sort?.length) return undefined;

    return sort
        .map(({ expression, order }) => `${expression} ${order.toUpperCase()}`)
        .join(', ');
}
