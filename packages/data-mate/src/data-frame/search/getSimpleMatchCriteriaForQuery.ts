import { inspect } from 'util';
import * as p from 'xlucene-parser';
import { SimpleFieldMatchTuple, SimpleMatchType } from '../../vector';
import { SimpleMatchCriteria } from '../interfaces';

export function getSimpleMatchCriteriaForQuery(
    parser: p.Parser
): SimpleMatchCriteria {
    const map = new Map<string, SimpleFieldMatchTuple[]>();
    parser.forTermTypes((node) => {
        if (!node.field) return;
        const tuples: SimpleFieldMatchTuple[] = map.get(node.field) ?? [];
        tuples.push(...getTuples(node));
        map.set(node.field, tuples);
    }, true);
    return map;
}

function getTuples(
    node: p.TermLikeNode
): SimpleFieldMatchTuple[] {
    if (p.isRange(node)) {
        if (!node.right) {
            return [[
                node.left.operator as SimpleMatchType,
                p.getFieldValue(node.left.value, {}, true)
            ]];
        }

        return [[
            node.left.operator as SimpleMatchType,
            p.getFieldValue(node.left.value, {}, true)
        ], [
            node.right.operator as SimpleMatchType,
            p.getFieldValue(node.right.value, {}, true)
        ]];
    }

    if (!('value' in node)) throw new Error(`Expected to find value in node: ${inspect(node)}`);

    return [[SimpleMatchType.eq, p.getFieldValue((node as any).value, {}, true)]];
}
