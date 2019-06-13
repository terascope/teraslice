import { baseModel } from './misc';

export default `
    enum SpaceConfigType {
        SEARCH
        STREAMING
    }
    type Space {
        ${baseModel}
        name: String!
        type: SpaceConfigType!
        endpoint: String!
        description: String
        data_type: DataType!
        views: [View]!
        roles: [Role]!
        config: JSON
    }
    input CreateSpaceInput {
        client_id: Int!
        name: String!
        type: SpaceConfigType!
        endpoint: String!
        description: String
        data_type: ID
        views: [ID!]
        roles: [ID!]
        config: JSON
    }
    input UpdateSpaceInput {
        client_id: Int
        id: ID!
        type: SpaceConfigType
        name: String
        endpoint: String
        description: String
        data_type: String
        views: [ID!]
        roles: [ID!]
        config: JSON
    }
`;
