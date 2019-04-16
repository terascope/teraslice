import * as ts from '@terascope/utils';
import { forEachModel } from '../utils';

const methods: string[] = [];

forEachModel((model) => {
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
