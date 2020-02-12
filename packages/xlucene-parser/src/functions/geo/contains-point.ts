import { AnyQuery, GeoShapeRelation, ESGeoShapeType } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { point } from '@turf/helpers';
import { pointInGeoShape } from './helpers';
import * as i from '../../interfaces';

function validate(params: i.Term[]) {
    const geoPointParam = params.find((node) => node.field === 'point');
    if (geoPointParam == null) throw new Error('Invalid geoContainsPoint query, need to specify a "point" parameter');
    const pointData = parseGeoPoint(geoPointParam.value as string);

    return { lat: pointData.lat, lon: pointData.lon };
}

const geoContainsPoint: i.FunctionDefinition = {
    name: 'geoContainsPoint',
    version: '1',
    create(_field: string, params: any, { logger }) {
        if (!_field || _field === '*') throw new Error('Field for geoContainsPoint cannot be empty or "*"');
        const { lat, lon } = validate(params);

        function toElasticsearchQuery(field: string) {
            const query: AnyQuery = {
                geo_shape: {
                    [field]: {
                        shape: {
                            type: ESGeoShapeType.Point,
                            coordinates: [lon, lat]
                        },
                        relation: GeoShapeRelation.Intersects
                    }
                }
            };

            if (logger.level() === 10) logger.trace('built geo shape query', { query });

            return { query };
        }

        function matcher() {
            const turfPoint = point([lon, lat]);
            return pointInGeoShape(turfPoint);
        }

        return {
            match: matcher(),
            toElasticsearchQuery
        };
    }
};

export default geoContainsPoint;
