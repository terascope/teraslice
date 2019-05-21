
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { DataType } from './datatype';

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

function identity(value: any) {
    return value;
}

// function parseObject(ast: any, variables: any) {
//     const value = Object.create(null);
//     ast.fields.forEach(field:any => {
//         // eslint-disable-next-line no-use-before-define
//         value[field.name.value] = parseLiteral(field.value, variables);
//     });

//     return value;
// }

function parseLiteral(ast: any, variables: any) {
    console.log('what is the ast', JSON.stringify(ast, null, 4));
    console.log('what is the variables', JSON.stringify(variables, null, 4));

    switch (ast.kind) {
        case Kind.STRING:
        case Kind.BOOLEAN:
            return ast.value;
        case Kind.INT:
        case Kind.FLOAT:
            return parseFloat(ast.value);
        case Kind.OBJECT:
            return false;
            // return parseObject(ast, variables);
        case Kind.LIST:
            return false; // return ast.values.map(n => parseLiteral(n, variables));
        case Kind.NULL:
            return null;
        case Kind.VARIABLE: {
            const name = ast.name.value;
            return variables ? variables[name] : undefined;
        }
        default:
            return undefined;
    }
}

export const GraphQLDataType = new GraphQLScalarType({
    name: 'GraphQLDataType',
    description: 'Scalar type for data type configs',
    serialize: identity,
    parseValue: identity,
    parseLiteral,
});
