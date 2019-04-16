import * as ts from '@terascope/utils';
import { modelNames } from '@terascope/data-access';

const methods: string[] = [];

modelNames.forEach((model) => {
    const createMethod = `create${model}`;
    const updateMethod = `update${model}`;
    const removeMethod = `remove${model}`;
    const varName = ts.firstToLower(model);

    const createExtraArgs = model === 'User' ? ', password: String!' : '';

    methods.push(`${createMethod}(${varName}: Create${model}Input!${createExtraArgs}): ${model}!`);
    methods.push(`${updateMethod}(${varName}: Update${model}Input!): ${model}!`);
    methods.push(`${removeMethod}(id: ID!): Boolean!`);
});

export default `
type Mutation {
    ${methods.join('\n    ')}
    updatePassword(id: String!, password: String!): Boolean!
    updateToken(id: String!): String!
}
`;
