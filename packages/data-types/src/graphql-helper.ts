
import { GraphQLScalarType, ASTNode } from 'graphql';
import { Kind } from 'graphql/language';
import { DataType } from './datatype';
import { TSError } from '@terascope/utils';

export function getGraphQlTypes(types: DataType[], typeInjection?:string) {
    const customTypesList: string[] = [];
    const baseTypeList: string[] = [];

    types.forEach((type) => {
        const { baseType, customTypes } = type.toGraphQl(null, typeInjection);
        customTypesList.push(...customTypes);
        baseTypeList.push(baseType);
    });

    return `
        ${baseTypeList.join('\n')}
        ${[...new Set(customTypesList)].join('\n')}
    `;
}

function serialize(value: any) {
    return value;
}

function parseValue(value: any) {
    return value;
}

// TODO: variable support?

function parseLiteral(ast: ASTNode) {
    console.log('what is the ast', JSON.stringify(ast, null, 4));
    if (ast.kind !== Kind.OBJECT) throw new TSError('type config "field" key must be set to an object');
    const data = ast.fields.reduce((accum, curr) => {
        const fieldName = curr.name.value;
        if (curr.value.kind !== Kind.OBJECT) throw new TSError(`field ${fieldName} must be set to an object`);
        if (curr.value.fields.length > 1) throw new TSError(`field ${fieldName} must be set to an object with only one key`);
        // @ts-ignore
        const [{ name: { value: keyName }, value: { value: keyValue } }] = curr.value.fields;
        console.log('what are my stuff here', keyName, keyValue)
        console.log('what are fields here', JSON.stringify(curr.value.fields,null, 4))

        if (keyName !== 'type') throw new TSError(`field ${fieldName} must be set to an object with only only key of type`);
        if (!keyValue) throw new TSError(`field ${fieldName} must be set to an object with only only key of type`);
        accum[fieldName] = { [keyName]: keyValue };
        return accum;
    }, {});

    console.log('what is the data', JSON.stringify(data, null, 4));
    return data;
}

export const GraphQLDataType = new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize,
    parseValue,
    parseLiteral,
});
