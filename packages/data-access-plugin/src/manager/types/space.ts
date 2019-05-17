import { baseModel } from './misc';

export default `
    type Space {
        ${baseModel}
        name: String!
        endpoint: String!
        description: String
        data_type: DataType!
        views: [View]!
        roles: [Role]!
        search_config: SpaceSearchConfig
        streaming_config: SpaceStreamingConfig
    }
    input CreateSpaceInput {
        client_id: Int!
        name: String!
        endpoint: String!
        description: String
        data_type: ID
        views: [ID!]
        roles: [ID!]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }
    input UpdateSpaceInput {
        client_id: Int
        id: ID!
        name: String
        endpoint: String
        description: String
        data_type: String
        views: [ID!]
        roles: [ID!]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }
    type SpaceSearchConfig {
        index: String!
        connection: String
        max_query_size: Int
        sort_default: String
        sort_dates_only: Boolean
        sort_enabled: Boolean
        default_geo_field: String
        preserve_index_name: Boolean
        require_query: Boolean
        default_date_field: String
        history_prefix: String
    }
    type SpaceStreamingConfig {
        connection: String
    }
    input SpaceSearchConfigInput {
        index: String!
        connection: String
        max_query_size: Int
        sort_default: String
        sort_dates_only: Boolean
        sort_enabled: Boolean
        default_geo_field: String
        preserve_index_name: Boolean
        timeseries_indexes: [String!]
        require_query: Boolean
        default_date_field: String
        enable_history: Boolean
        history_prefix: String
    }
    input SpaceStreamingConfigInput {
        connection: String
    }
`;
