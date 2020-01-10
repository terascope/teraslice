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

    toGraphQL(typeName?: string, isInput?: boolean, includePrivate?: boolean) {
        const customTypeName: string = this._formatGQLTypeName(
            typeName || 'Object',
            isInput,
            true,
            this.version,
        );

        const properties: string[] = [];
        const customTypes: string[] = [];

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) {
                continue;
            }

            if (isInput && includePrivate && this._removeBase(field).startsWith('_')) {
                continue;
            }

            const result = type.toGraphQL(typeName, isInput, includePrivate);

            properties.push(this._removeBase(result.type));

            customTypes.push(...result.customTypes);
        }

        const props = [...properties].sort();

        const defType = isInput ? 'input' : 'type';
        customTypes.push(`
            ${defType} ${customTypeName} {
                ${props.join('\n')}
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
