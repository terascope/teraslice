export const schema = `
    enum UserType {
        USER
        ADMIN
        SUPERADMIN
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
        require_query: Boolean
        default_date_field: String
        history_prefix: String
    }

    input SpaceStreamingConfigInput {
        connection: String
    }
`;

export const commonViewModel = `excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean`;

export function flattenSchemas(schemas: string[]): string {
    return schemas.map((str) => str.trim()).join('\n');
}
