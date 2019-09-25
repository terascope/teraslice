
// @ts-ignore
import { polygon, lineString } from '@turf/helpers';
// @ts-ignore
import lineToPolygon from '@turf/line-to-polygon';
import { geoMatcher } from './helpers';
import { parseGeoPoint } from '../../../utils';
import * as i from '../../interfaces';
import { AnyQuery } from '../../../translator';

function validate(params: i.Term[]) {
    const geoPointsParam = params.find((node) => node.field === 'points');
    if (geoPointsParam == null) throw new Error('geoPolygon query needs to specify a "points" parameter');
    if (!Array.isArray(geoPointsParam.value)) throw new Error('points parameter must be an array');
    // @ts-ignore we are ignoreing util we have a better story around list expressions
    const points = geoPointsParam.value.map((node) => {
        if (!node.value) throw new Error('points parameter must be an array of string values');
        return parseGeoPoint(node.value);
    });

    if (points.length < 3) throw new Error('geoPolygon points parameter must have at least three points');

    return points;
}

const geoPolygon: i.FunctionDefinition = {
    name: 'geoPolygon',
    version: '1',
    create(field: string, params: any, { logger }) {
        if (!field || field === '*') throw new Error('field for geoBox cannot be empty or "*"');
        // eslint-disable-next-line @typescript-eslint/camelcase
        const points = validate(params);

        function toElasticsearchQuery() {
            const query: AnyQuery = {};
            query.geo_polygon = {
                [field]: {
                    points
                }
            };
            logger.trace('built geo polygon query', { query });

            return { query };
        }

        function matcher() {
            const polyPoints = points.map((obj) => [obj.lon, obj.lat]);
            const line = lineString(polyPoints);
            const matcherPolygon = lineToPolygon(line);

            // Nothing matches so return false
            if (polygon == null) return () => false;
            return geoMatcher(matcherPolygon);
        }

        return {
            match: matcher(),
            toElasticsearchQuery
        };
    }
};

export default geoPolygon;
