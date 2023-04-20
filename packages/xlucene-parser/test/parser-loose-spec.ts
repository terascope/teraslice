import 'jest-extended';
import { xLuceneFieldType } from '@terascope/types';
import {
    Parser, NodeType,
} from '../src';

/**
 * TODO add a case for all cases - see cases folder
 * but do a simple data mate > doc matcher test first
 * and also simple translator and queryAccess tests too
 */
describe('Parser', () => {
    it('should be able to resolve variables in loose mode', () => {
        const parser = new Parser('a:$foo AND b:$bar AND c:$buz', {
            type_config: {
                a: xLuceneFieldType.String,
                b: xLuceneFieldType.String,
                c: xLuceneFieldType.String
            },
            loose: true
        }).resolveVariables({ foo: 'foo', bar: 'bar' });

        expect(parser.ast).toMatchObject(
            {
                type: NodeType.LogicalGroup,
                flow: [
                    {
                        type: NodeType.Conjunction,
                        nodes: [
                            {
                                type: NodeType.Term,
                                field: 'a',
                                // value: { type: 'variable', value: 'foo', },
                                value: { type: 'value', value: 'foo' },
                            },
                            {
                                type: NodeType.Term,
                                field: 'b',
                                // value: { type: 'variable', value: 'bar', },
                                value: { type: 'value', value: 'bar' },
                            },
                        ],
                    },
                ],
            },
        );
    });
});
