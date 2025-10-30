import { AnyQuery, xLuceneVariables } from '@terascope/types';
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

        return {
            match: geoPointWithinRangeFP({ lat, lon }, `${distance}${paramUnit}`),
            toElasticsearchQuery
        };
    }
};

export default geoDistance;
