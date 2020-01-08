import { TypeConfig } from 'xlucene-evaluator';
import { TypeESMapping, GraphQLType } from '../../interfaces';
import BaseType from './base-type';

export type NestedTypes = { [field: string]: BaseType };

export default class GroupType extends BaseType {
    readonly types: NestedTypes;
    readonly version: number;

    constructor(field: string, version: number, types: NestedTypes) {
        super(field, types[field].config);
        this.version = version;
        this.types = types;
    }

    toESMapping(_version?: number): TypeESMapping {
        return {} as any;
    }

    toGraphQL(typeName?: string): GraphQLType {
        const customTypeName = `DT${typeName || 'Object'}V${this.version}`;

        const properties: string[] = [];
        const customTypes: string[] = [];

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) {
                continue;
            }

            const result = type.toGraphQL(typeName);

            properties.push(this._removeBase(result.type));

            customTypes.push(...result.customTypes);
        }

        customTypes.push(`
            type ${customTypeName} {
                ${[...properties].sort().join('\n')}
            }
        `);

        return this._formatGql(customTypeName, customTypes);
    }

    toXlucene(): TypeConfig {
        const configs = Object.values(this.types).map((type) => type.toXlucene());
        return Object.assign({}, ...configs);
    }

    private _removeBase(str: string) {
        return str.replace(`${this.field}.`, '').trim();
    }
}
