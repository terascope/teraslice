import {
    GEO_DISTANCE_UNITS, GeoDistanceUnit, GeoQuery, GeoQuerySort,
    xLuceneVariables
} from '@terascope/types';
import { parseGeoPoint, parseGeoDistance, geoPointWithinRangeFP } from '@terascope/geo-utils';
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
function getValidUnit(defaultValue: GeoDistanceUnit, value: any) {
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
            const sortUnit = getValidUnit(paramUnit, options.geo_sort.unit);
            const sortPoint = parseGeoPoint(options.geo_sort.point, false);

            const unit = paramUnit || sortUnit;
            const order = options.geo_sort.order || options.geo_sort.default_order;

            const query: GeoQuery = {
                geo_distance: {
                    distance: `${distance}${unit}`,
                    [field]: {
                        lat,
                        lon
                    }
                }
            };

            const sort: GeoQuerySort = {
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

        return {
            match: geoPointWithinRangeFP({ lat, lon }, `${distance}${paramUnit}`),
            toElasticsearchQuery
        };
    }
};

export default geoDistance;
