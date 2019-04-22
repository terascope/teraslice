import { firstToLower } from '@terascope/utils';
import { forEachModel } from '../utils';

const methods: string[] = [];

forEachModel((model) => {
    methods.push(`${firstToLower(model)}(id: ID!): ${model}!`);
    methods.push(`${firstToLower(model)}s(query: String, size: Int, from: Int, sort: String): [${model}!]!`);
    methods.push(`${firstToLower(model)}sCount(query: String): Int!`);
});

export default `
type Query {
    ${methods.join('\n    ')}
    authenticate(username: String, password: String, token: String): User!
}
`;
