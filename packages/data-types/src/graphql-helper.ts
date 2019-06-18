import { GraphQLScalarType, ASTNode, buildSchema, printSchema } from 'graphql';
import { Kind } from 'graphql/language';
import { TSError } from '@terascope/utils';
import { mapping } from './types/versions/mapping';
import { Type } from './interfaces';

let allTypes = {};

for (const version in mapping) {
    allTypes = Object.assign(allTypes, mapping[version]);
}

function serialize(value: any) {
    return value;
}

function parseValue(value: any) {
    return value;
}

// TODO: variable support?
function parseLiteral(ast: ASTNode) {
    if (ast.kind !== Kind.OBJECT) throw new TSError('type config "field" key must be set to an object');
    return ast.fields.reduce((accum, curr) => {
        const fieldName = curr.name.value;
        if (curr.value.kind !== Kind.OBJECT) throw new TSError(`field ${fieldName} must be set to an object`);
        if (curr.value.fields.length > 1) throw new TSError(`field ${fieldName} must be set to an object with only one key`);
        const [
            {
                name: { value: keyName },
                // @ts-ignore
                value: { value: keyValue },
            },
        ] = curr.value.fields;
        const validKeys: (keyof Type)[] = ['type', 'array'];
        if (!validKeys.includes(keyName as keyof Type)) {
            throw new TSError(`field ${fieldName} must be set to an object with only only key of type`);
        }
        if (!keyValue) {
            throw new TSError('type config must have proper types set, it was not configured correctly');
        }
        if (allTypes[keyValue] == null) {
            throw new TSError(`Type: ${keyValue} is not a valid type`);
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
    const schema = buildSchema(schemaStr);
    return printSchema(schema);
}
