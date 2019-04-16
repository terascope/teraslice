import { forEachModel } from '../utils';

const methods: string[] = [];

forEachModel((model) => {
    const findOneMethod = `find${model}`;
    const findManyMethod = `find${model}s`;

    methods.push(`${findOneMethod}(id: ID!): ${model}!`);
    methods.push(`${findManyMethod}(query: String = "*", from: Int = 0, sort: String, size: Int): [${model}!]!`);
});

export default `
type Query {
    ${methods.join('\n    ')}
    authenticate(username: String, password: String, token: String): User!
}
`;
