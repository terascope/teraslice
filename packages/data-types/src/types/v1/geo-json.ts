import {
    xLuceneFieldType,
    ESFieldType,
    xLuceneTypeConfig,
    ClientMetadata
} from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class GeoJSON extends BaseType {
    toESMapping(clientMetaData: ClientMetadata): TypeESMapping {
        this._validateESMapping();
        // we need to used deprecated quadtree and strategy because CONTAINS is
        // not yet supported in 6.X or 7.X as of now
        return {
            mapping: {
                [this.field]: {
                    type: 'geo_shape' as ESFieldType,
                    ...((clientMetaData.distribution === 'opensearch')
                    || (clientMetaData.distribution === 'elasticsearch'
                        && clientMetaData.majorVersion < 8)) && {
                        tree: 'quadtree',
                        strategy: 'recursive'
                    }
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
