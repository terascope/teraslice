import { firstToLower } from '@terascope/utils';
import { forEachModel } from '../utils';

const methods: string[] = [];

forEachModel((model) => {
    methods.push(`${firstToLower(model)}(id: ID!): ${model}!`);
    methods.push(`${firstToLower(model)}s(query: String = "*", from: Int = 0, sort: String, size: Int): [${model}!]!`);
});

export default `
type Query {
    ${methods.join('\n    ')}
    authenticate(username: String, password: String, token: String): User!
}
`;
