import {
    TSError,
    isString,
    isEmpty,
    matchWildcard
} from '@terascope/utils';
import * as p from 'xlucene-parser';
import * as i from '@terascope/types';
import { UtilsTranslateQueryOptions } from './interfaces';
// import { parseWildCard, matchString }

type WildCardQueryResults = i.WildcardQuery | i.MultiMatchQuery

type TermQueryResults =
    | i.TermQuery
    | i.MatchQuery
    | i.MatchPhraseQuery
    | i.MultiMatchQuery

type RangeQueryResults =
    | i.RangeQuery
    | i.MultiMatchQuery
    | undefined

export function translateQuery(
    parser: p.Parser,
    options: UtilsTranslateQueryOptions
): i.ElasticsearchDSLResult {
    const { logger, type_config: typeConfig } = options;
    let sort: i.AnyQuerySort|i.AnyQuerySort[]|undefined;

    function buildAnyQuery(node: p.AST): i.AnyQuery | undefined {
        // if no field and is wildcard
        if (p.isWildcard(node) && !node.field && node.value === '*') {
            return {
                bool: {
                    filter: [],
                },
            };
        }

        if (p.isGroupLike(node)) {
            return buildBoolQuery(node);
        }

        if (p.isNegation(node)) {
            return buildNegationQuery(node);
        }

        if (p.isExists(node)) {
            return buildExistsQuery(node);
        }

        if (p.isTermType(node)) {
            const query = buildTermLevelQuery(node);
            if (query) return query;
        }

        const error = new TSError(`Unexpected problem when translating xlucene query ${parser.query}`, {
            context: {
                node,
                ast: parser.ast,
            },
        });

        logger.error(error);
    }

    function buildTermLevelQuery(node: p.TermLikeAST): i.AnyQuery | i.BoolQuery | undefined {
        if (p.isWildcardField(node)) {
            if (isEmpty(typeConfig)) {
                throw new Error(
                    `Configuration for type_config needs to be provided with fields related to ${node.field}`
                );
            }
            const should = Object.keys(typeConfig)
                .filter((field) => matchWildcard(node.field as string, field))
                .map((field) => Object.assign({}, node, { field }))
                .map((newNode) => buildTermLevelQuery(newNode)) as i.AnyQuery[];

            return {
                bool: {
                    should
                }
            };
        }

        if (p.isTerm(node)) {
            return buildTermQuery(node);
        }

        if (p.isRegexp(node)) {
            return buildRegExprQuery(node);
        }

        if (p.isWildcard(node)) {
            return buildWildcardQuery(node);
        }

        if (p.isRange(node)) {
            return buildRangeQuery(node);
        }

        if (p.isGeoBoundingBox(node)) {
            return buildGeoBoundingBoxQuery(node);
        }

        if (p.isGeoDistance(node)) {
            return buildGeoDistanceQuery(node);
        }

        if (p.isFunctionExpression(node)) {
            const { query, sort: sortQuery } = node.instance.toElasticsearchQuery(
                getTermField(node),
                options
            );
            // TODO: review how sort works in this module
            if (sortQuery != null) {
                if (!sort) {
                    sort = sortQuery;
                } else if (Array.isArray(sort)) {
                    sort.push(sortQuery);
                } else {
                    sort = [sort, sortQuery];
                }
            }

            return query;
        }
    }

    function buildMultiMatchQuery(node: p.TermLikeAST, query: string): i.MultiMatchQuery {
        const multiMatchQuery: i.MultiMatchQuery = {
            multi_match: {
                query,
            },
        };

        logger.trace('built mutli-match query', { node, multiMatchQuery });
        return multiMatchQuery;
    }

    function buildGeoBoundingBoxQuery(node: p.GeoBoundingBox): i.GeoQuery | undefined {
        if (isMultiMatch(node)) return;

        const field = getTermField(node);

        const geoQuery: i.GeoQuery = {};
        geoQuery.geo_bounding_box = {};
        geoQuery.geo_bounding_box[field] = {
            top_left: node.top_left,
            bottom_right: node.bottom_right,
        };

        logger.trace('built geo bounding box query', { node, geoQuery });
        return geoQuery;
    }

    function buildGeoDistanceQuery(node: p.GeoDistance): i.GeoQuery | undefined {
        if (isMultiMatch(node)) return;

        const field = getTermField(node);

        const unit = node.unit || options.geo_sort_unit;
        const order = options.geo_sort_order;

        const geoQuery: i.GeoQuery = {};
        geoQuery.geo_distance = {
            distance: `${node.distance}${unit}`,
        };
        geoQuery.geo_distance[field] = {
            lat: node.lat,
            lon: node.lon,
        };

        const geoQuerySort = {
            _geo_distance: {
                order,
                unit,
                [field]: {
                    lat: node.lat,
                    lon: node.lon
                }
            }
        };

        if (!sort) {
            sort = geoQuerySort;
        } else if (Array.isArray(sort)) {
            sort.push(geoQuerySort);
        } else {
            sort = [sort, geoQuerySort];
        }

        logger.trace('built geo distance query', { node, geoQuery });
        return geoQuery;
    }

    function buildRangeQuery(node: p.Range): RangeQueryResults {
        if (isMultiMatch(node)) {
            if (!node.right) {
                return;
            }
            const query = `${node.left.operator}${node.left.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);
        const rangeQuery: i.RangeQuery = {
            range: {
                [field]: p.parseRange(node, true),
            },
        };

        logger.trace('built range query', { node, rangeQuery });
        return rangeQuery;
    }

    function buildTermQuery(node: p.Term): TermQueryResults {
        if (isMultiMatch(node)) {
            const query = `${node.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);

        if (isString(node.value)) {
            const matchQuery: i.MatchQuery = {
                match: {
                    [field]: {
                        operator: 'and',
                        query: node.value,
                    },
                },
            };

            logger.trace('built match query', { node, matchQuery });
            return matchQuery;
        }

        const termQuery: i.TermQuery = {
            term: {
                [field]: node.value,
            },
        };

        logger.trace('built term query', { node, termQuery });
        return termQuery;
    }

    function buildWildcardQuery(node: p.Wildcard): WildCardQueryResults {
        if (isMultiMatch(node)) {
            const query = `${node.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);
        const wildcardQuery: i.WildcardQuery = {
            wildcard: {
                [field]: node.value,
            },
        };

        logger.trace('built wildcard query', { node, wildcardQuery });
        return wildcardQuery;
    }

    function buildRegExprQuery(
        node: p.Regexp
    ): i.RegExprQuery | i.MultiMatchQuery | i.QueryStringQuery {
        if (isMultiMatch(node)) {
            const query = `${node.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);

        if (node.analyzed) {
            return {
                query_string: {
                    fields: [field],
                    query: `/${node.value}/`
                }
            };
        }

        const regexQuery: i.RegExprQuery = {
            regexp: {
                [field]: {
                    value: node.value,
                    flags: 'COMPLEMENT|EMPTY|INTERSECTION|INTERVAL'
                }
            },
        };

        logger.trace('built regexpr query', { node, regexQuery });
        return regexQuery;
    }

    function buildExistsQuery(node: p.Exists): i.ExistsQuery {
        const existsQuery: i.ExistsQuery = {
            exists: {
                field: node.field,
            },
        };

        logger.trace('built exists query', { node, existsQuery });
        return existsQuery;
    }

    function buildBoolQuery(node: p.GroupLikeAST): i.BoolQuery | undefined {
        const should: i.AnyQuery[] = [];

        for (const conj of node.flow) {
            const query = buildConjunctionQuery(conj);
            should.push(...flattenQuery(query, 'should'));
        }
        if (!should.length) return;

        const boolQuery: i.BoolQuery = {
            bool: {
                should,
            },
        };

        logger.trace('built bool query', { node, boolQuery });
        return boolQuery;
    }

    function buildConjunctionQuery(conj: p.Conjunction): i.BoolQuery {
        const filter: i.AnyQuery[] = [];
        for (const node of conj.nodes) {
            const query = buildAnyQuery(node);
            filter.push(...flattenQuery(query, 'filter'));
        }

        return {
            bool: {
                filter,
            },
        };
    }

    function buildNegationQuery(node: p.Negation): i.BoolQuery | undefined {
        const query = buildAnyQuery(node.node);
        if (!query) return;

        const mustNot = flattenQuery(query, 'must_not');
        logger.trace('built negation query', mustNot, node);
        return {
            bool: {
                must_not: mustNot,
            },
        };
    }

    let topLevelQuery: i.MatchAllQuery|i.ConstantScoreQuery;
    if (p.isEmptyAST(parser.ast)) {
        topLevelQuery = {
            match_all: {},
        };
    } else {
        const anyQuery = buildAnyQuery(parser.ast);
        const filter = compactFinalQuery(anyQuery);
        topLevelQuery = {
            constant_score: {
                filter,
            }
        };
    }

    if (!sort && options.default_geo_field && options.geo_sort_point) {
        sort = {
            _geo_distance: {
                order: options.geo_sort_order,
                unit: options.geo_sort_unit,
                [options.default_geo_field]: options.geo_sort_point,
            }
        };
    }

    return {
        query: topLevelQuery,
        // avoid setting it to undefined
        ...(sort && { sort })
    };
}

export function isMultiMatch(node: p.TermLikeAST) {
    return !node.field || node.field === '*';
}

export function getTermField(node: p.TermLikeAST): string {
    return node.field!;
}

export function flattenQuery(
    query: i.AnyQuery | undefined,
    flattenTo: i.BoolQueryTypes
): i.AnyQuery[] {
    if (!query) return [];
    if (isBoolQuery(query) && canFlattenBoolQuery(query, flattenTo)) {
        return query.bool[flattenTo]!;
    }
    return [query];
}

/** This prevents double nested queries that do the same thing */
export function canFlattenBoolQuery(query: i.BoolQuery, flattenTo: i.BoolQueryTypes) {
    const types = Object.keys(query.bool);
    if (types.length !== 1) return false;
    return types[0] === flattenTo;
}

export function isBoolQuery(query: any): query is i.BoolQuery {
    return query && query.bool != null;
}

export function compactFinalQuery(query?: i.AnyQuery): i.AnyQuery | i.AnyQuery[] {
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
