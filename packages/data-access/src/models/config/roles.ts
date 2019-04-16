import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<Role> = {
    version: 1,
    name: 'roles',
    mapping: {
        properties: {
            client_id: {
                type: 'integer'
            },
            name: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                },
            }
        }
    },
    schema: {
        properties: {
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            }
        },
        required: ['client_id', 'name']
    },
};

export interface Role extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
    */
    client_id?: number;

    /**
     * Name of the Role
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;
}

export default config;
