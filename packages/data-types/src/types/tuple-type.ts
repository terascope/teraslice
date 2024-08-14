import { DataTypeFieldConfig, xLuceneTypeConfig } from '@terascope/types';
import BaseType from './base-type.js';
import { GraphQLType, TypeESMapping } from '../interfaces.js';

export default class TupleType extends BaseType {
    readonly types: readonly BaseType[];

    constructor(
        field: string,
        version: number,
        baseConfig: DataTypeFieldConfig,
        types: BaseType[]
    ) {
        super(field, baseConfig, version);
        this.types = types.slice();
    }

    toESMapping(): TypeESMapping {
        return {
            mapping: { [this.field]: { enabled: false } }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSON');
    }

    toXlucene(): xLuceneTypeConfig {
        const configs = this.types.map((type) => type.toXlucene());
        return Object.assign({}, ...configs);
    }
}
