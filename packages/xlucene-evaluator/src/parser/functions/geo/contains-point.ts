import { point } from '@turf/helpers';
import { pointInGeoShape } from './helpers';
import { parseGeoPoint } from '../../../utils';
import * as i from '../../interfaces';
import { AnyQuery, ESGeoShapeType } from '../../../translator/interfaces';
import { GeoShapeRelation } from '../../../interfaces';

function validate(params: i.Term[]) {
    const geoPointParam = params.find((node) => node.field === 'point');
    if (geoPointParam == null) throw new Error('geoContainsPoint query needs to specify a "point" parameter');
    const pointData = parseGeoPoint(geoPointParam.value as string);

    return { lat: pointData.lat, lon: pointData.lon };
}

const geoContainsPoint: i.FunctionDefinition = {
    name: 'geoContainsPoint',
    version: '1',
    create(field: string, params: any, { logger }) {
        if (!field || field === '*') throw new Error('field for geoContainsPoint cannot be empty or "*"');
        const { lat, lon } = validate(params);

        function toElasticsearchQuery() {
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

            logger.trace('built geo shape query', { query });

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
