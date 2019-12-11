import {
    GraphQLScalarType, ASTNode, buildSchema, printSchema
} from 'graphql';
import { Kind, StringValueNode } from 'graphql/language';
import { TSError } from '@terascope/utils';
import { mapping } from './types/versions/mapping';

const allTypes = Object.assign({}, ...Object.values(mapping));

function serialize(value: any) {
    return value;
}

function parseValue(value: any) {
    return value;
}

function parseLiteral(ast: ASTNode) {
    if (ast.kind !== Kind.OBJECT) throw new TSError('Type Config "field" key must be set to an object');

    return ast.fields.reduce((accum, curr) => {
        const fieldName = curr.name.value;
        if (
            curr.value.kind !== Kind.OBJECT
            || curr.value.fields.length > 1
        ) {
            throw new TSError(`Field ${fieldName} must be set to an object`);
        }

        const [field] = curr.value.fields;

        const { value: keyName } = field.name;
        const { value: keyValue } = field.value as StringValueNode;

        if (keyName === 'type') {
            if (!keyValue || !allTypes[keyValue]) {
                throw new TSError(`${keyName}: ${keyValue} is not a valid type`);
            }
        }

        if (keyName === 'description') {
            if (keyValue != null && typeof keyValue !== 'string') {
                throw new TSError(`${keyName}: ${keyValue} is not a valid string`);
            }
        }

        if (keyName === 'array') {
            if (keyValue != null && typeof keyValue !== 'boolean') {
                throw new TSError(`${keyName}: ${keyValue} is not a valid boolean`);
            }
        }

        accum[fieldName] = { [keyName]: keyValue };
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
