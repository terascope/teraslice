import { AnyQuery, xLuceneVariables } from '@terascope/types';
import { inGeoBoundingBoxFP, validateBoundingBox } from '@terascope/geo-utils';
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

    const { topLeft, bottomRight } = validateBoundingBox(topLeftValue, bottomRightValue);

    return {
        top_left: topLeft,
        bottom_right: bottomRight
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

        /**
         * A bounding box as arithmetic rather than as a spatial predicate, so it needs no
         * spatial extension at all.
         *
         * `validateBoundingBox` has already rejected a box that would cross the antimeridian,
         * so the box is axis-aligned and containment is two inclusive range checks - which is
         * boundary-inclusive by construction, exactly as turf's `booleanPointInPolygon` is
         * with its default `ignoreBoundary: false`.
        */
        function toSQLQuery(field: string, options: i.FunctionSQLOptions) {
            const { dialect } = options;

            return {
                query: dialect.geoPointInBoundingBox(
                    dialect.fieldRef(field), top_left, bottom_right
                )
            };
        }

        return {
            match: inGeoBoundingBoxFP(top_left, bottom_right),
            toElasticsearchQuery,
            toSQLQuery
        };
    }
};

export default geoBox;
