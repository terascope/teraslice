import { polyHasPoint, makeCircle } from './helpers';
import { parseGeoPoint, parseGeoDistance } from '../../../utils';
import * as i from '../../interfaces';
import { UtilsTranslateQueryOptions } from '../../../translator/interfaces';
import { AnyQuery } from '../../../translator';

function validate(params: i.Term[]) {
    const distanceParam = params.find((node) => node.field === 'distance');
    const geoPointParam = params.find((node) => node.field === 'point');

    if (distanceParam == null) throw new Error('geoDistance query needs to specify a "distance" parameter');
    if (geoPointParam == null) throw new Error('geoDistance query needs to specify a "point" parameter');

    const point = parseGeoPoint(geoPointParam.value as string);
    const distance = parseGeoDistance(distanceParam.value as string);

    return {
        ...point,
        ...distance
    };
}

const geoDistance: i.FunctionDefinition = {
    name: 'geoDistance',
    version: '1',
    create(_field: string, params: any, { logger }) {
        if (!_field || _field === '*') throw new Error('field for geoDistance cannot be empty or "*"');
        const {
            lat, lon, distance, unit: paramUnit
        } = validate(params);

        function toElasticsearchQuery(field: string, options: UtilsTranslateQueryOptions) {
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

        function matcher() {
            // There is a mismatch between elasticsearch and turf on "inch" naming
            const units = paramUnit === 'inch' ? 'inches' : paramUnit;
            const config = { units };
            const polygon = makeCircle({ lat, lon }, distance, config);
            // Nothing matches so return false
            if (polygon == null) return () => false;
            return polyHasPoint(polygon);
        }

        return {
            match: matcher(),
            toElasticsearchQuery
        };
    }
};

export default geoDistance;
