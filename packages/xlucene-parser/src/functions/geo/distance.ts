import {
    GEO_DISTANCE_UNITS, GeoDistanceUnit, GeoQuery, GeoDistanceSort,
    xLuceneVariables
} from '@terascope/types';
import {
    parseGeoPoint, parseGeoDistance, geoPointWithinRangeFP,
    geoDistanceToMeters
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

/** returns the value if valid, otherwise the default value */
function getValidUnit(defaultValue: GeoDistanceUnit, value?: GeoDistanceUnit): GeoDistanceUnit {
    if (!value || typeof value !== 'string') return defaultValue;
    if (Object.values(GEO_DISTANCE_UNITS).includes(value as GeoDistanceUnit)) return value;
    return defaultValue;
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
            const sortUnit = getValidUnit(paramUnit, options.geo_sort_config?.unit);
            const sortPoint = parseGeoPoint(options.geo_sort_config?.point, false);

            const unit = paramUnit || sortUnit;
            const order = options.geo_sort_config?.order || options.geo_sort_config?.default_order || 'asc';

            const query: GeoQuery = {
                geo_distance: {
                    distance: `${distance}${unit}`,
                    [field]: {
                        lat,
                        lon
                    }
                }
            };

            const sort: GeoDistanceSort = {
                _geo_distance: {
                    order,
                    unit: sortUnit,
                    [field]: {
                        lat: sortPoint?.lat || lat,
                        lon: sortPoint?.lon || lon
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
         * The query as a SQL predicate, plus the distance expression to sort on.
         *
         * SQL distance functions work in meters, so the distance is converted here with
         * `geoDistanceToMeters`, which uses the same turf factors as `match`.
         *
         * The SQL is more precise than `match`: `makeGeoCircle` approximates the circle with
         * a 64-sided polygon, which falls short of the radius by up to `r * (1 - cos(pi/64))`
         * (about 1.2 km at 1000 km). The SQL compares the actual distance.
        */
        function toSQLQuery(field: string, options: i.FunctionSQLOptions) {
            const { dialect } = options;
            const unit = (paramUnit || options.geo_sort_unit || 'meters') as GeoDistanceUnit;
            const fieldExpr = dialect.fieldRef(field);
            const meters = geoDistanceToMeters(distance, unit);

            return {
                query: dialect.geoPointWithinDistance(fieldExpr, { lat, lon }, meters),
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
