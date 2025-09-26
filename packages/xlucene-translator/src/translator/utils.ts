import {
    TSError, isString, isArray, isEmpty,
    matchWildcard
} from '@terascope/utils';
import {
    isEmptyNode, isWildcardField, isTerm,
    parseRange, isRange, isRegexp,
    isWildcard, isFunctionNode, initFunction,
    getFieldValue, isGroupLike, isNegation,
    isExists, isTermType, isConjunction,
    type Parser, type TermLikeNode, type Exists,
    type GroupLikeNode, type Conjunction, type Negation,
    type Range, type Regexp, type Node, type Wildcard,
    type Term,
} from 'xlucene-parser';
import type {
    WildcardQuery, MultiMatchQuery, QueryStringQuery,
    TermQuery, MatchQuery, MatchPhraseQuery,
    RangeQuery, AnyQuerySort, ElasticsearchDSLResult,
    MatchAllQuery, ConstantScoreQuery, MatchNoneQuery,
    AnyQuery, BoolQuery, ExistsQuery, RegExprQuery,
    BoolQueryTypes, KNNQuery, AggregationTypes,
    TranslatorAggregations
} from '@terascope/types';
import { UtilsTranslateQueryOptions } from './interfaces.js';

type WildCardQueryResults
    = WildcardQuery
        | MultiMatchQuery
        | QueryStringQuery;

type TermQueryResults
    = | TermQuery
        | MatchQuery
        | MatchPhraseQuery
        | MultiMatchQuery;

type RangeQueryResults
    = | RangeQuery
        | MultiMatchQuery
        | undefined;

type SortArgs = AnyQuerySort | AnyQuerySort[] | undefined;

interface QueryContext extends UtilsTranslateQueryOptions {
    sort?: SortArgs;
}

export function translateQuery(
    parser: Parser,
    options: UtilsTranslateQueryOptions
    // TODO: this is to restrictive of a type, should use what opensearch provides
): ElasticsearchDSLResult {
    const context: QueryContext = {
        ...options
    };
    // TODO: this should probably reference the search type from opensearch, maybe not
    let topLevelQuery: MatchAllQuery | ConstantScoreQuery | MatchNoneQuery | KNNQuery;

    if (isEmptyNode(parser.ast)) {
        topLevelQuery = {
            match_all: {},
        };
    } else {
        let hasKNN = false;
        let allANDConjunctions = true;

        parser.walkAST((node: Node) => {
            if (isFunctionNode(node) && node.name === 'knn') {
                hasKNN = true;
                return;
            }

            if (isConjunction(node)) {
                if (node.nodes.length === 1) {
                    allANDConjunctions = false;
                    return;
                }
            }
        });

        let anyQuery = null;

        if (hasKNN && allANDConjunctions) {
            anyQuery = buildKNNQuery(parser, context);
        } else {
            anyQuery = buildAnyQuery(parser.ast, context);
        }

        if (anyQuery == null) {
            const error = new TSError(`Unexpected problem when translating xlucene query ${parser.query}`, {
                context: {
                    ast: parser.ast,
                },
            });

            options.logger.error(error);
        }

        const filter = compactFinalQuery(anyQuery);

        if (isArray(filter) && !filter.length) {
            // match_none because an empty filter can
            // throw a parsing exception
            topLevelQuery = {
                match_none: {}
            };
        } else if (hasKNN && allANDConjunctions) {
            // @ts-expect-error
            topLevelQuery = {
                ...anyQuery
            };
        } else {
            topLevelQuery = {
                constant_score: {
                    filter
                }
            };
        }
    }

    let { sort } = context;

    if (!sort && options.default_geo_field && options.geo_sort_point) {
        sort = {
            _geo_distance: {
                order: options.geo_sort_order,
                unit: options.geo_sort_unit,
                [options.default_geo_field]: options.geo_sort_point,
            }
        };
    }

    const aggregations = buildAggregation(options);

    return {
        query: topLevelQuery,
        ...(aggregations && { aggregations, size: 0 }),
        // avoid setting it to undefined
        ...(sort && { sort })
    };
}

const AGGREGATION_DICTIONARY = {
    min: 'min',
    max: 'max',
    sum: 'sum',
    avg: 'avg',
    count: '',
    unique: 'cardinality'
} as Record<AggregationTypes, string>;

function makeGroupByQuerySegment(groupBy: string[]) {
    if (groupBy.length > 1) {
        const terms = groupBy.map((str) => {
            return { field: str };
        });

        return {
            multi_terms: {
                terms
            }
        };
    } else {
        const field = groupBy[0];
        return {
            terms: {
                field
            }
        };
    }
}

function makeAggregationQuerySegment(aggregations: TranslatorAggregations) {
    const { field, aggregation } = aggregations[0];

    const aggType = AGGREGATION_DICTIONARY[aggregation];
    if (!aggType) {
        throw new Error(`Unsupported aggregation type: ${aggregation}`);
    }

    return {
        [aggType]: {
            field,
            ...(aggType === 'cardinality' && { precision_threshold: 40000 })
        }
    };
}

function buildAggregation(options: UtilsTranslateQueryOptions): undefined | Record<string, any> {
    const { aggregations, groupBy } = options;
    const groupByLength = groupBy.length;
    const aggregationsLength = aggregations.length;

    if (aggregationsLength > 0 || groupByLength > 0) {
        if (aggregationsLength > 0 && groupByLength > 0) {
            return {
                aggregation_result: {
                    ...makeGroupByQuerySegment(groupBy),
                    aggregations: {
                        aggregation_result: {
                            ...makeAggregationQuerySegment(aggregations)
                        }
                    }
                }
            };
        } else if (groupByLength > 0) {
            return {
                aggregation_result: makeGroupByQuerySegment(groupBy)
            };
        } else if (aggregations.length > 0) {
            return {
                aggregation_result: makeAggregationQuerySegment(aggregations)
            };
        }
    }

    return;
}

function buildTermLevelQuery(
    node: TermLikeNode,
    context: QueryContext,
): AnyQuery | BoolQuery | undefined {
    if (isWildcardField(node)) {
        if (isEmpty(context.type_config)) {
            throw new Error(
                `Configuration for type_config needs to be provided with fields related to ${node.field}`
            );
        }
        const should = Object.keys(context.type_config)
            .filter((field) => matchWildcard(node.field as string, field))
            .map((field) => Object.assign({}, node, { field }))
            .map((newNode) => buildTermLevelQuery(newNode, context)) as AnyQuery[];

        return {
            bool: {
                should
            }
        };
    }

    if (isTerm(node)) {
        return buildTermQuery(node, context);
    }

    if (isRegexp(node)) {
        return buildRegExprQuery(node, context);
    }

    if (isWildcard(node)) {
        return buildWildcardQuery(node, context);
    }

    if (isRange(node)) {
        return buildRangeQuery(node, context);
    }

    if (isFunctionNode(node)) {
        const { variables, type_config } = context;
        const instance = initFunction({ node, variables, type_config });
        const { query, sort: sortQuery } = instance.toElasticsearchQuery(
            getTermField(node),
            context
        );
            // TODO: review how sort works in this module
        if (sortQuery != null) {
            if (!context.sort) {
                context.sort = sortQuery;
            } else if (Array.isArray(context.sort)) {
                context.sort.push(sortQuery);
            } else {
                context.sort = [context.sort, sortQuery];
            }
        }

        return query;
    }
}

function buildExistsQuery(node: Exists): ExistsQuery {
    const existsQuery: ExistsQuery = {
        exists: {
            field: node.field,
        },
    };

    return existsQuery;
}

function buildBoolQuery(
    node: GroupLikeNode,
    context: QueryContext,
): BoolQuery | undefined {
    const should: AnyQuery[] = [];

    for (const conj of node.flow) {
        const query = buildConjunctionQuery(conj, context);
        should.push(...flattenQuery(query, 'should'));
    }

    if (!should.length) return;

    const boolQuery: BoolQuery = {
        bool: {
            should,
        },
    };

    return boolQuery;
}

function buildConjunctionQuery(
    conj: Conjunction,
    context: QueryContext,
): BoolQuery | undefined {
    const filter: AnyQuery[] = [];

    for (const node of conj.nodes) {
        const query = buildAnyQuery(node, context);
        filter.push(...flattenQuery(query, 'filter'));
    }

    // should match if AND statement
    if (!filter.length || conj.nodes.length !== filter.length) return;

    return {
        bool: {
            filter,
        },
    };
}

function buildNegationQuery(
    node: Negation,
    context: QueryContext,
): BoolQuery | undefined {
    const query = buildAnyQuery(node.node, context);
    if (!query) return;

    const mustNot = flattenQuery(query, 'must_not');

    return {
        bool: {
            must_not: mustNot,
        },
    };
}

function buildMultiMatchQuery(node: TermLikeNode, query: string): MultiMatchQuery {
    const multiMatchQuery: MultiMatchQuery = {
        multi_match: {
            query,
        },
    };

    return multiMatchQuery;
}

function buildRangeQuery(node: Range, context: QueryContext): RangeQueryResults {
    if (isMultiMatch(node)) {
        if (!node.right) {
            return;
        }
        const leftValue = getFieldValue(node.left.value, context.variables);
        const query = `${node.left.operator}${leftValue}`;

        return buildMultiMatchQuery(node, query);
    }

    const field = getTermField(node);
    const rangeQuery: RangeQuery = {
        range: {
            [field]: parseRange(node, context.variables, true),
        },
    };

    return rangeQuery;
}

function buildTermQuery(
    node: Term,
    context: QueryContext
): TermQueryResults | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return;

    if (isMultiMatch(node)) {
        const query = `${value}`;
        return buildMultiMatchQuery(node, query);
    }

    const field = getTermField(node);

    if (isString(value) || node.analyzed) {
        const matchQuery: MatchQuery = {
            match: {
                [field]: {
                    operator: 'and',
                    query: value,
                },
            },
        };

        return matchQuery;
    }

    const termQuery: TermQuery = {
        term: {
            [field]: value,
        },
    };

    return termQuery;
}

function buildWildcardQuery(
    node: Wildcard,
    context: QueryContext
): WildCardQueryResults | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return;

    if (isMultiMatch(node)) {
        const query = `${value}`;
        return buildMultiMatchQuery(node, query);
    }

    const field = getTermField(node);

    if (node.analyzed) {
        return {
            query_string: {
                fields: [field],
                query: value
            }
        };
    }

    const wildcardQuery: WildcardQuery = {
        wildcard: {
            [field]: value,
        },
    };

    return wildcardQuery;
}

function buildRegExprQuery(
    node: Regexp,
    context: QueryContext
): RegExprQuery | MultiMatchQuery | QueryStringQuery | undefined {
    const value = getFieldValue(node.value, context.variables, true);
    if (value == null) return;

    if (isMultiMatch(node)) {
        const query = `${value}`;
        return buildMultiMatchQuery(node, query);
    }

    const field = getTermField(node);

    if (node.analyzed) {
        return {
            query_string: {
                fields: [field],
                query: `/${value}/`
            }
        };
    }

    const regexQuery: RegExprQuery = {
        regexp: {
            [field]: {
                value,
                flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
            }
        },
    };

    return regexQuery;
}

function buildKNNQuery(
    parser: Parser,
    context: QueryContext,
): AnyQuery | undefined {
    let knnQuery: KNNQuery | undefined;
    const must: AnyQuery[] = [];

    parser.walkAST((node: Node) => {
        if (isFunctionNode(node) && node.name === 'knn') {
            const { variables, type_config } = context;
            const instance = initFunction({ node, variables, type_config });
            const { query } = instance.toElasticsearchQuery(
                getTermField(node),
                context
            );
            knnQuery = query as KNNQuery;
        } else if (isTermType(node)) {
            const query = buildTermLevelQuery(node, context);
            if (query) must.push(query);
        } else if (isNegation(node)) {
            const query = buildNegationQuery(node, context);
            if (query) must.push(query);
        } else if (isExists(node)) {
            must.push(buildExistsQuery(node));
        }
    });

    const finalQuery: KNNQuery = { knn: {} };

    if (knnQuery && must.length) {
        for (const [field, config] of Object.entries(knnQuery.knn)) {
            const knnConjunction = {
                ...config,
                filter: {
                    bool: {
                        should: [
                            {
                                bool: {
                                    filter: [
                                        ...must
                                    ]
                                }
                            }
                        ]
                    }
                }
            };
            finalQuery.knn[field] = knnConjunction;
        }
    } else if (knnQuery) {
        for (const [field, config] of Object.entries(knnQuery.knn)) {
            finalQuery.knn[field] = config;
        }
    }

    return finalQuery;
}

function buildAnyQuery(
    node: Node,
    context: QueryContext,
): AnyQuery | undefined {
    // if no field and is wildcard
    if (
        isWildcard(node)
        && !node.field
        && getFieldValue(node.value, context.variables) === '*'
    ) {
        return {
            bool: {
                filter: [],
            },
        };
    }

    if (isGroupLike(node)) {
        return buildBoolQuery(node, context);
    }

    if (isNegation(node)) {
        return buildNegationQuery(node, context);
    }

    if (isExists(node)) {
        return buildExistsQuery(node);
    }

    if (isTermType(node)) {
        const query = buildTermLevelQuery(node, context);
        if (query) return query;
    }
}

export function isMultiMatch(node: TermLikeNode): boolean {
    return !node.field || node.field === '*';
}

export function getTermField(node: TermLikeNode): string {
    return node.field!;
}

export function flattenQuery(
    query: AnyQuery | undefined,
    flattenTo: BoolQueryTypes
): AnyQuery[] {
    if (!query) return [];
    if (isBoolQuery(query) && canFlattenBoolQuery(query, flattenTo)) {
        return query.bool[flattenTo]!;
    }
    return [query];
}

/** This prevents double nested queries that do the same thing */
export function canFlattenBoolQuery(query: BoolQuery, flattenTo: BoolQueryTypes): boolean {
    const types = Object.keys(query.bool);
    if (types.length !== 1) return false;
    return types[0] === flattenTo;
}

export function isBoolQuery(query: unknown): query is BoolQuery {
    if (!query || typeof query !== 'object') return false;
    return (query as any).bool != null;
}

export function compactFinalQuery(query?: AnyQuery): AnyQuery | AnyQuery[] {
    if (!query) return [];
    if (isBoolQuery(query) && canFlattenBoolQuery(query, 'filter')) {
        const filter = query.bool.filter!;
        if (!filter.length) return query;
        if (filter.length === 1) {
            return filter[0];
        }
        return filter;
    }
    return query;
}
