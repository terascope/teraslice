import { ModelConfig } from '../base';
import { RoleModel } from '../roles';

const config: ModelConfig<RoleModel> = {
    version: 1,
    name: 'roles',
    mapping: {
        properties: {
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
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            }
        },
        required: ['name']
    },
};

export = config;
