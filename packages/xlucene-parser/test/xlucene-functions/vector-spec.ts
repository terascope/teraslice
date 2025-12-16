import 'jest-extended';
import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';
import { debugLogger } from '@terascope/core-utils';
import { Parser, initFunction } from '../../src/index.js';
import { FunctionElasticsearchOptions, FunctionNode } from '../../src/interfaces.js';

describe('knn', () => {
    const typeConfig: xLuceneTypeConfig = { vector: xLuceneFieldType.Number };
    const options: FunctionElasticsearchOptions = {
        logger: debugLogger('test'),
        type_config: {}
    };

    it('can make a function ast', () => {
        const query = 'vector:knn(vector:[1,2] k:5)';

        const { ast } = new Parser(query, {
            type_config: typeConfig
        });
        const {
            name, type, field
        } = ast as FunctionNode;

        const instance = initFunction({
            node: ast as FunctionNode,
            variables: {},
            type_config: typeConfig
        });

        expect(name).toEqual('knn');
        expect(type).toEqual('function');
        expect(field).toEqual('vector');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    it('can make a function ast with variable', () => {
        const query = 'vector:knn(vector:$foo k:5)';
        const variables = {
            foo: [1, 2]
        };
        const { ast } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        const {
            name, type, field
        } = ast as FunctionNode;

        const instance = initFunction({
            node: ast as FunctionNode,
            variables: {},
            type_config: typeConfig
        });

        expect(name).toEqual('knn');
        expect(type).toEqual('function');
        expect(field).toEqual('vector');
        expect(instance.match).toBeFunction();
        expect(instance.toElasticsearchQuery).toBeFunction();
    });

    it('match is not supported and will throw', () => {
        const query = 'vector:knn(vector:$foo k:5)';
        const variables = {
            foo: [1, 2]
        };
        const { ast } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        const instance = initFunction({
            node: ast as FunctionNode,
            variables: {},
            type_config: typeConfig
        });

        expect(() => instance.match([1, 2])).toThrow();
    });

    it('toElasticsearchQuery can return a proper knn search segment', () => {
        const field = 'someField';
        const k = 5;
        const query = `${field}:knn(vector:$foo k:${k})`;
        const variables = {
            foo: [1, 2]
        };
        const { ast } = new Parser(query, {
            type_config: typeConfig,
            variables
        });

        const instance = initFunction({
            node: ast as FunctionNode,
            variables: {},
            type_config: typeConfig
        });

        const search = instance.toElasticsearchQuery(field, options);

        expect(search).toMatchObject({
            query: {
                knn: {
                    [field]: {
                        vector: variables.foo,
                        k
                    }
                }
            }
        });
    });
});
