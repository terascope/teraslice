import { baseModel } from './misc';

export default `
    enum UserType {
        SUPERADMIN
        ADMIN
        DATAADMIN
        USER
    }
    type User {
        ${baseModel}
        username: String!
        firstname: String!
        lastname: String!
        email: String
        role: Role
        type: UserType
        api_token: String
    }
    input CreateUserInput {
        client_id: Int
        username: String!
        firstname: String!
        lastname: String!
        email: String
        type: UserType
        role: ID
    }
    input UpdateUserInput {
        client_id: Int
        id: ID!
        username: String
        firstname: String
        lastname: String
        email: String
        type: UserType
        role: ID
    }
`;
