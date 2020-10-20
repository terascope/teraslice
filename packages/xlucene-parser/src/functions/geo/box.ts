import { AnyQuery, xLuceneVariables } from '@terascope/types';
import { parseGeoPoint } from '@terascope/utils';
import { polyHasPoint, makeBBox } from './helpers';
import * as i from '../../interfaces';
import { getFieldValue, logger } from '../../utils';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const topLeftParam = params.find((node) => node.field === 'top_left');
    const bottomRightParam = params.find((node) => node.field === 'bottom_right');

    if (topLeftParam == null) throw new Error('Invalid geoBox query, need to specify a "topLeft" parameter');
    if (bottomRightParam == null) throw new Error('Invalid geoBox query, need to specify a "bottomRight" parameter');

    const topLeftValue = getFieldValue<string>(topLeftParam.value, variables);
    const bottomRightValue = getFieldValue<string>(bottomRightParam.value, variables);

    return {
        top_left: parseGeoPoint(topLeftValue),
        bottom_right: parseGeoPoint(bottomRightValue)
    };
}

const geoBox: i.FunctionDefinition = {
    name: 'geoBox',
    version: '1',
    create({
        node, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoBox cannot be empty or "*"');
        }
        const { top_left, bottom_right } = validate(node.params, variables);

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
