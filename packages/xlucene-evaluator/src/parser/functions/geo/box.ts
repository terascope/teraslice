import { polyHasPoint, makeBBox } from './helpers';
import * as i from '../../interfaces';
import { parseGeoPoint } from '../../../utils';
import { AnyQuery } from '../../../translator';

function validate(params: i.Term[]) {
    const topLeftParam = params.find((node) => node.field === 'top_left');
    const bottomRightParam = params.find((node) => node.field === 'bottom_right');

    if (topLeftParam == null) throw new Error('geoBox query needs to specify a "topLeft" parameter');
    if (bottomRightParam == null) throw new Error('geoBox query needs to specify a "bottomRight" parameter');

    return {
        top_left: parseGeoPoint(topLeftParam.value as string),
        bottom_right: parseGeoPoint(bottomRightParam.value as string)
    };
}

const geoBox: i.FunctionDefinition = {
    name: 'geoBox',
    version: '1',
    create(_field: string, params: any, { logger }) {
        if (!_field || _field === '*') throw new Error('field for geoBox cannot be empty or "*"');
        // eslint-disable-next-line @typescript-eslint/camelcase
        const { top_left, bottom_right } = validate(params);

        function toElasticsearchQuery(field: string) {
            const query: AnyQuery = {};
            query.geo_bounding_box = {};
            query.geo_bounding_box[field] = {
                top_left,
                bottom_right,
            };

            if (logger.level() === 10) logger.trace('built geo bounding box query', { query });
            return { query };
        }

        function matcher() {
            const polygon = makeBBox(top_left, bottom_right);
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

export default geoBox;
