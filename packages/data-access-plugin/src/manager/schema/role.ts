import { baseModel } from './misc';

export default `
    type Role {
        ${baseModel}
        name: String
        description: String
    }
    input CreateRoleInput {
        client_id: Int
        name: String!
        description: String
    }
    input UpdateRoleInput {
        client_id: Int
        id: ID!
        name: String
        description: String
    }
`;
