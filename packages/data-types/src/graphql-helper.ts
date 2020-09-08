import * as ts from '@terascope/utils';
import { Kind, StringValueNode, ASTNode } from 'graphql/language';
import { GraphQLScalarType } from 'graphql/type/definition';
import { buildSchema, printSchema } from 'graphql/utilities';

function serialize(value: any) {
    return value;
}

function parseValue(value: any) {
    return value;
}

function parseLiteral(ast: ASTNode) {
    if (ast.kind !== Kind.OBJECT) throw new Error('Type Config "field" key must be set to an object');

    return ast.fields.reduce((accum, curr) => {
        const fieldName = curr.name.value;

        if (curr.value.kind !== Kind.OBJECT) {
            throw new Error(`Field ${fieldName} must be set to an object`);
        }

        curr.value.fields.forEach((field) => {
            if (!field || field.kind !== Kind.OBJECT_FIELD) {
                throw new Error(`Field ${fieldName} must be an object`);
            }

            const { value: keyName } = field.name;
            const valueNode = field.value;
            const keyValue = (valueNode as StringValueNode).value;

            if (keyName === 'type') {
                if (valueNode.kind !== Kind.STRING) {
                    throw new Error(`${keyName}: ${keyValue} is not a valid type`);
                }
            }

            if (keyName === 'description') {
                if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.NULL) {
                    throw new Error(`${keyName}: ${keyValue} is not a valid string`);
                }
            }

            if (keyName === 'array' || keyName === 'indexed') {
                if (valueNode.kind !== Kind.BOOLEAN && valueNode.kind !== Kind.NULL) {
                    throw new Error(`${keyName}: ${keyValue} is not a valid boolean`);
                }
            }

            accum[fieldName] = {
                ...accum[fieldName],
                [keyName]: keyValue
            };
        });

        return accum;
    }, {});
}

export const GraphQLDataType = new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
});

export function formatSchema(schemaStr: string, removeScalars = false): string {
    const schema = buildSchema(schemaStr, {
        commentDescriptions: true,
    });
    const result = printSchema(schema, {
        commentDescriptions: true
    });

    if (removeScalars) {
        return result.replace(/\s*scalar \w+/g, '');
    }
    return result;
}

export function formatGQLComment(desc?: string, prefix?: string): string {
    let description = ts.trim(desc);
    if (prefix) {
        description = description ? `${prefix} - ${description}` : prefix;
    }
    if (!description) return '';

    return description
        .split('\n')
        .map((str) => ts.trim(str).replace(/^#/, '').trim())
        .filter(Boolean)
        .map((str) => `# ${str}`)
        .join('\n');
}
