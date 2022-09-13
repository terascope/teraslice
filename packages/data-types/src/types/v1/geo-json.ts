import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class GeoJSON extends BaseType {
    toESMapping(): TypeESMapping {
        if (this.config.indexed === false) {
            throw new Error(`${this.constructor.name} is required to be indexed`);
        }
        // we need to used deprecated quadtree and strategy because CONTAINS is
        // not yet supported in 6.X or 7.X as of now
        return {
            mapping: {
                [this.field]: {
                    type: 'geo_shape' as ESFieldType,
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };
    }

    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL(): GraphQLType {
        return this._formatGql('GeoJSON', 'scalar GeoJSON');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.GeoJSON };
    }
}
