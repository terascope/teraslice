import { inspect } from 'util';
import * as p from 'xlucene-parser';
import { SimpleValueMatchTuple, SimpleMatchType } from '../../vector';
import {
    SimpleFieldMatch, SimpleMatchCriteria, SimpleMatchOperator
} from '../SimpleMatchCriteria';

export function getSimpleMatchCriteriaForQuery(
    parser: p.Parser
): SimpleMatchCriteria {
    return buildCriteria(parser.ast);
}

function buildCriteria(
    node: p.Node
): SimpleMatchCriteria {
    if (p.isNegation(node)) {
        return new SimpleMatchCriteria([buildCriteria(node.node)], SimpleMatchOperator.NEGATE);
    }

    if (p.isGroupLike(node)) {
        return new SimpleMatchCriteria(
            node.flow.map((n) => buildCriteria(n)), SimpleMatchOperator.OR
        );
    }

    if (p.isConjunction(node)) {
        return new SimpleMatchCriteria(
            node.nodes.map((n) => buildCriteria(n)), SimpleMatchOperator.AND
        );
    }

    if (p.isFunctionNode(node) || p.termTypes.includes(node.type)) {
        return new SimpleMatchCriteria(
            getSimpleMatchSet(node as p.TermLikeNode|p.FunctionNode),
            SimpleMatchOperator.NONE
        );
    }

    throw new Error(`Unknown xLucene node when generating match criteria: ${inspect(node)}`);
}

function getSimpleMatchSet(
    node: p.TermLikeNode|p.FunctionNode
): SimpleFieldMatch {
    if (p.isRange(node)) {
        if (!node.right) {
            const tuples: SimpleValueMatchTuple[] = [[
                node.left.operator as SimpleMatchType,
                p.getFieldValue(node.left.value, {}, true)
            ]];
            return new SimpleFieldMatch(node.field, tuples);
        }

        const tuples: SimpleValueMatchTuple[] = [[
            node.left.operator as SimpleMatchType,
            p.getFieldValue(node.left.value, {}, true)
        ], [
            node.right.operator as SimpleMatchType,
            p.getFieldValue(node.right.value, {}, true)
        ]];
        return new SimpleFieldMatch(node.field, tuples);
    }

    if (p.isFunctionNode(node)) {
        // we need to add support for this
        return new SimpleFieldMatch(node.field, []);
    }

    if (!('value' in node)) throw new Error(`Expected to find value in node: ${inspect(node)}`);

    const tuples: SimpleValueMatchTuple[] = [
        [SimpleMatchType.eq, p.getFieldValue((node as any).value, {}, true)]
    ];
    return new SimpleFieldMatch((node as any).field, tuples);
}
