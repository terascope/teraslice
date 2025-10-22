import {
    AnyQuery,
    GeoShapeRelation,
    ESGeoShapeType,
    xLuceneVariables
} from '@terascope/types';
import { parseGeoPoint, geoContainsFP } from '@terascope/core-utils';
import { getFieldValue, logger } from '../../utils.js';
import * as i from '../../interfaces.js';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const geoPointParam = params.find((node) => node.field === 'point');
    if (geoPointParam == null) {
        throw new TypeError('Invalid geoContainsPoint query, need to specify a "point" parameter');
    }
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
        const { lat, lon } = validate(node.params as i.Term[], variables);

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

        return {
            match: geoContainsFP({ lat, lon }),
            toElasticsearchQuery
        };
    }
};

export default geoContainsPoint;
