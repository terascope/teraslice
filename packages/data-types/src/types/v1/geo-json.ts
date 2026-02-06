import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ClientMetadata
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class GeoJSON extends BaseType {
    toESMapping(_clientMetaData: ClientMetadata): TypeESMapping {
        this._validateESMapping();

        return {
            mapping: {
                [this.field]: {
                    type: 'geo_shape' as ESFieldType,
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
