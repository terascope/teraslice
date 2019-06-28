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
        inherit_from: [ID!]
        config: DataTypeConfig

        # virutal references
        resolved_config: DataTypeConfig
        spaces: [Space]
        views: [View]
    }

    input CreateDataTypeInput {
        client_id: Int!
        name: String!
        description: String
        config: DataTypeConfigInput
        inherit_from: [ID!]
    }

    input UpdateDataTypeInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        config: DataTypeConfigInput
        inherit_from: [ID!]
    }
`;
