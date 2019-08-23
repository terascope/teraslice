import { TSError, isString } from '@terascope/utils';
import * as p from '../parser';
import * as i from './interfaces';
import { parseRange } from '../utils';

export function translateQuery(parser: p.Parser, options: i.UtilsTranslateQueryOptions): i.ElasticsearchDSLResult {
    const { logger } = options;
    let sort: i.AnyQuerySort|undefined;

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
        return;
    }

    function buildTermLevelQuery(node: p.TermLikeAST): i.AnyQuery | undefined {
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

        return;
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
        geoQuery['geo_bounding_box'] = {};
        geoQuery['geo_bounding_box'][field] = {
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
        geoQuery['geo_distance'] = {
            distance: `${node.distance}${unit}`,
        };
        geoQuery['geo_distance'][field] = {
            lat: node.lat,
            lon: node.lon,
        };

        if (!sort) {
            sort = {
                _geo_distance: {
                    order,
                    unit,
                    [field]: {
                        lat: node.lat,
                        lon: node.lon
                    }
                }
            };
        }

        logger.trace('built geo distance query', { node, geoQuery });
        return geoQuery;
    }

    function buildRangeQuery(node: p.Range): i.RangeQuery | i.MultiMatchQuery | undefined {
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
                [field]: parseRange(node, true),
            },
        };

        logger.trace('built range query', { node, rangeQuery });
        return rangeQuery;
    }

    function buildTermQuery(node: p.Term): i.TermQuery | i.MatchQuery | i.MatchPhraseQuery | i.MultiMatchQuery {
        if (isMultiMatch(node)) {
            const query = `${node.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);

        if (isString(node.value)) {
            // @ts-ignore
            if (node.quoted) {
                const matchPhraseQuery: i.MatchPhraseQuery = {
                    match_phrase: {
                        [field]: {
                            query: `${node.value}`,
                        },
                    },
                };

                logger.trace('built match phrase query', { node, matchPhraseQuery });
                return matchPhraseQuery;
            }

            const matchQuery: i.MatchQuery = {
                match: {
                    [field]: {
                        operator: 'and',
                        query: `${node.value}`,
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

    function buildWildcardQuery(node: p.Wildcard): i.WildcardQuery | i.MultiMatchQuery {
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

    function buildRegExprQuery(node: p.Regexp): i.RegExprQuery | i.MultiMatchQuery {
        if (isMultiMatch(node)) {
            const query = `${node.value}`;
            return buildMultiMatchQuery(node, query);
        }

        const field = getTermField(node);

        const regexQuery: i.RegExprQuery = {
            regexp: {
                [field]: node.value,
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

export function flattenQuery(query: i.AnyQuery | undefined, flattenTo: i.BoolQueryTypes): i.AnyQuery[] {
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
