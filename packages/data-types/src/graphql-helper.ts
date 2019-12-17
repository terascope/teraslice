import {
    GraphQLScalarType, ASTNode, buildSchema, printSchema
} from 'graphql';
import { Kind, StringValueNode } from 'graphql/language';
import { mapping } from './types/versions/mapping';

const allTypes = Object.assign({}, ...Object.values(mapping));

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
        console.error(JSON.stringify(curr.value, null, 4));
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
                if (valueNode.kind !== Kind.STRING || !allTypes[valueNode.value]) {
                    throw new Error(`${keyName}: ${keyValue} is not a valid type`);
                }
            }

            if (keyName === 'description') {
                if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.NULL) {
                    throw new Error(`${keyName}: ${keyValue} is not a valid string`);
                }
            }

            if (keyName === 'array') {
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

export function formatSchema(schemaStr: string) {
    const schema = buildSchema(schemaStr, { commentDescriptions: true });
    return printSchema(schema, {
        commentDescriptions: true
    });
}
