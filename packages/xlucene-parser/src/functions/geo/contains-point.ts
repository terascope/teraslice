import {
    AnyQuery,
    GeoShapeRelation,
    ESGeoShapeType,
    xLuceneVariables
} from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { point } from '@turf/helpers';
import { pointInGeoShape } from './helpers';
import { getFieldValue, logger } from '../../utils';
import * as i from '../../interfaces';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const geoPointParam = params.find((node) => node.field === 'point');
    if (geoPointParam == null) throw new Error('Invalid geoContainsPoint query, need to specify a "point" parameter');
    const pointData = parseGeoPoint(getFieldValue<string>(geoPointParam.value, variables));

    return { lat: pointData.lat, lon: pointData.lon };
}

const geoContainsPoint: i.FunctionDefinition = {
    name: 'geoContainsPoint',
    version: '1',
    create({
        node, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoContainsPoint cannot be empty or "*"');
        }
        const { lat, lon } = validate(node.params, variables);

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
