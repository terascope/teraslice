import { TypeConfig } from 'xlucene-evaluator';
import * as i from '../../interfaces';
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

    toESMapping(version?: number) {
        const {
            mapping,
            analyzer = {},
            tokenizer = {},
        } = this.types[this.field].toESMapping(version);
        const baseMapping = mapping[this.field] as i.PropertyESTypeMapping;
        if (!baseMapping.properties) {
            baseMapping.properties = {};
        }

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) {
                continue;
            }

            const fieldResult = type.toESMapping(version);

            const nestedField = this._removeBase(field);
            const fieldMapping = fieldResult.mapping[field] as i.PropertyESTypes;
            baseMapping.properties[nestedField] = fieldMapping;

            Object.assign(tokenizer, fieldResult.tokenizer);
            Object.assign(analyzer, fieldResult.analyzer);
        }

        return {
            mapping,
            analyzer,
            tokenizer,
        };
    }

    toGraphQL(typeName?: string) {
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
