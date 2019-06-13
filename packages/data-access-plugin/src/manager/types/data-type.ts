import { baseModel } from './misc';

export default `
    type DataTypeConfig {
        fields: DataTypeFields
        version: Int
    }

    input DataTypeConfigInput {
        fields: DataTypeFields!
        version: Int!
    }

    type DataType {
        ${baseModel}
        name: String
        description: String
        config: DataTypeConfig
        # virutal references
        spaces: [Space]
        views: [View]
    }

    input CreateDataTypeInput {
        client_id: Int!
        name: String!
        description: String
        config: DataTypeConfigInput
    }

    input UpdateDataTypeInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        config: DataTypeConfigInput
    }
`;
