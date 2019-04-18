import { baseModel } from './misc';

const commonViewModel = `excludes: [String]
includes: [String]
constraint: String
prevent_prefix_wildcard: Boolean`;

export default `
    type View {
        ${baseModel}
        name: String!
        description: String
        data_type: DataType
        roles: [Role]
        ${commonViewModel}
    }
    input CreateViewInput {
        client_id: Int
        name: String!
        description: String
        data_type: ID!
        roles: [ID!]
        ${commonViewModel}
    }
    input UpdateViewInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        data_type: ID
        roles: [ID!]
        ${commonViewModel}
    }
`;
