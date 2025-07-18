import { AnyQuery, xLuceneVariables } from '@terascope/types';
import { parseGeoPoint, inGeoBoundingBoxFP } from '@terascope/utils';
import * as i from '../../interfaces.js';
import { getFieldValue, logger } from '../../utils.js';

function validate(params: i.Term[], variables: xLuceneVariables) {
    const topLeftParam = params.find((node) => node.field === 'top_left');
    const bottomRightParam = params.find((node) => node.field === 'bottom_right');

    if (topLeftParam == null) {
        throw new TypeError('Invalid geoBox query, need to specify a "topLeft" parameter');
    }
    if (bottomRightParam == null) {
        throw new TypeError('Invalid geoBox query, need to specify a "bottomRight" parameter');
    }

    const topLeftValue = getFieldValue<string>(topLeftParam.value, variables);
    const bottomRightValue = getFieldValue<string>(bottomRightParam.value, variables);

    return {
        top_left: parseGeoPoint(topLeftValue),
        bottom_right: parseGeoPoint(bottomRightValue)
    };
}

const geoBox: i.FunctionDefinition = {
    name: 'knn',
    version: '1',
    create({
        node, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for geoBox cannot be empty or "*"');
        }
        const { top_left, bottom_right } = validate(node.params as i.Term[], variables);

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

        return {
            match: inGeoBoundingBoxFP(top_left, bottom_right),
            toElasticsearchQuery
        };
    }
};

export default geoBox;
