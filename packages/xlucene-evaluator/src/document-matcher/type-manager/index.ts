import typeMapping, { BaseType } from './types';

import { AST, TypeConfig, NodeType } from '../../interfaces';
import { LuceneQueryParser } from '../..';

export default class TypeManager {
    typeList: BaseType[];

    protected _parser: LuceneQueryParser;

    constructor(parser: LuceneQueryParser, typeConfig?: TypeConfig) {
        this._parser = parser;
        this.typeList = this._buildFieldListConfig(typeConfig);
    }

    private _buildFieldListConfig(typeConfig: TypeConfig = {}): BaseType[] {
        const typeList:BaseType[] = [];
        const results = {};

        this._parser.walkLuceneAst((node) => {
            if (node.field == null) return;

            const configType = typeConfig[node.field];

            let type: NodeType = 'string';
            if (typeMapping[configType] != null) {
                type = configType;
            } else if (typeMapping[node.type] != null) {
                type = node.type;
            }

            if (!results[type]) results[type] = {};
            results[type][node.field] = true;
        });

        for (const type in results) {
            const TypeClass = typeMapping[type];
            typeList.push(new TypeClass(results[type]));
        }

        return typeList;
    }

    public processAst(): AST {
        return this.typeList.reduce((astObj, type) => {
            return type.processAst(astObj);
        }, this._parser._ast);
    }

    public injectTypeFilterFns(): object {
        return this.typeList.reduce((prev, type) => {
            const filterFns = type.injectTypeFilterFns();
            if (filterFns !== null) {
                Object.assign(prev, filterFns);
            }
            return prev;
        }, {});
    }
}
