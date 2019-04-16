import { baseModel } from './misc';

export default `
    type DataType {
        ${baseModel}
        name: String
        description: String
        type_config: JSON
    }
    input CreateDataTypeInput {
        client_id: Int!
        name: String!
        description: String
        type_config: JSON
    }
    input UpdateDataTypeInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        type_config: JSON
    }
`;
