
import * as apollo from 'apollo-server-express';
import { SelectionSetNode, ArgumentNode } from 'graphql';
import { ParsedJoinFields } from './interfaces';

interface MyDict {
    [key: string]: boolean;
}

function getJoinKeys(ast: ArgumentNode[]) {
    for (const arg of ast) {
        if (arg.name.value === 'join') {
            if (arg.value.kind === 'ListValue') {
                return arg.value.values.map((obj) => {
                    if (obj.kind === 'StringValue') {
                        return obj.value;
                    }
                    throw new apollo.UserInputError('values inside a join parameter must be a string');
                });
            }
            throw new apollo.UserInputError('join parameters must be an array of strings');
        }
    }
    return [];
}

function checkQuery(ast: SelectionSetNode) {
    const currentFields: MyDict = {};
    const joinKeys: string[] = [];

    for (const selector of ast.selections) {
        if (selector.kind === 'Field') {
            const { name: { value: field } } = selector;
            currentFields[field] = true;
            if (selector.arguments) {
                // @ts-ignore
                joinKeys.push(...getJoinKeys(selector.arguments));
            }
            if (selector.selectionSet) checkQuery(selector.selectionSet);
        }
    }

    for (const originalKey of joinKeys) {
        const { origin: key } = parseJoinField(originalKey);
        if (!currentFields[key]) {
            const errMsg = `Invalid join on field "${key}", you may only join on a field that is being returned in a query`;
            throw new apollo.UserInputError(errMsg);
        }
    }
}

export function parseJoinField(fieldParams: string): ParsedJoinFields {
    // any chars between a | and a whitespace or :
    let field = fieldParams;
    let extraParams: undefined | string;
    const regex = /\|([^: ]+)/;
    const hasExtraParams = field.match(regex);

    if (hasExtraParams) {
        [, extraParams] = hasExtraParams;
        field = field.replace(`|${extraParams}`, '');
    }

    const selectorTargets = field.split(':');
    const origin = selectorTargets[0];
    const target = selectorTargets[1] || origin;

    return { origin, target, extraParams };
}


export function validateJoins(query: string) {
    const { definitions } = apollo.gql(query);
    definitions.forEach((type) => {
        if (type.kind === 'OperationDefinition') {
            checkQuery(type.selectionSet);
        }
    });
}
