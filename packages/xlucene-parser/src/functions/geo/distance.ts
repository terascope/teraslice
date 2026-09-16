import { AnyQuery, GeoDistanceUnit, xLuceneVariables } from '@terascope/types';
import {
    parseGeoPoint, parseGeoDistance, geoPointWithinRangeFP,
    geoDistanceToMetres
} from '@terascope/geo-utils';
import * as i from '../../interfaces.js';
import { getFieldValue, logger } from '../../utils.js';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const distanceParam = params.find((node) => node.field === 'distance');
    const geoPointParam = params.find((node) => node.field === 'point');

    if (distanceParam == null) {
        throw new TypeError('Invalid geoDistance query, need to specify a "distance" parameter');
    }
    if (geoPointParam == null) {
        throw new TypeError('Invalid geoDistance query, need to specify a "point" parameter');
    }

    const geoPointValue = getFieldValue<string>(geoPointParam.value, variables);
    const distanceValue = getFieldValue<string>(distanceParam.value, variables);

    const point = parseGeoPoint(geoPointValue);
    const distance = parseGeoDistance(distanceValue);

    return {
        ...point,
        ...distance
    };
}

const geoDistance: i.FunctionDefinition = {
    name: 'geoDistance',
    version: '1',
    create({
        node, variables
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoDistance cannot be empty or "*"');
        }
        const {
            lat, lon, distance, unit: paramUnit
        } = validate(node.params as i.Term[], variables);

        function toElasticsearchQuery(field: string, options: i.FunctionElasticsearchOptions) {
            const unit = paramUnit || options.geo_sort_unit;
            const order = options.geo_sort_order;

            const query: AnyQuery = {};
            query.geo_distance = {
                distance: `${distance}${unit}`,
            };
            query.geo_distance[field] = {
                lat,
                lon,
            };

            const sort = {
                _geo_distance: {
                    order,
                    unit,
                    [field]: {
                        lat,
                        lon
                    }
                }
            };

            if (logger.level() === 10) logger.trace('built geo distance query', { query });

            return {
                query,
                sort
            };
        }

        /**
         * The same query as a SQL predicate, plus the distance expression to sort on.
         *
         * **A SQL engine measures in metres**, so the unit is resolved here rather than
         * being handed down: `geoDistanceToMetres` uses turf's factors, the same ones
         * `match` reaches through `makeGeoCircle`.
         *
         * This is also more accurate than `match` is, deliberately. `makeGeoCircle` builds a
         * 64-sided polygon and tests point-in-polygon, which under-approximates the circle by
         * about `r * (1 - cos(pi/64))` - ~1.2 km at 1000 km - while a distance test has no
         * such band.
        */
        function toSQLQuery(field: string, options: i.FunctionSQLOptions) {
            const { dialect } = options;
            const unit = (paramUnit || options.geo_sort_unit || 'meters') as GeoDistanceUnit;
            const fieldExpr = dialect.fieldRef(field);
            const metres = geoDistanceToMetres(distance, unit);

            return {
                query: dialect.geoPointWithinDistance(fieldExpr, { lat, lon }, metres),
                sort: {
                    expression: dialect.geoPointDistance(fieldExpr, { lat, lon }),
                    order: options.geo_sort_order ?? 'asc'
                }
            };
        }

        return {
            match: geoPointWithinRangeFP({ lat, lon }, `${distance}${paramUnit}`),
            toElasticsearchQuery,
            toSQLQuery
        };
    }
};

export default geoDistance;
