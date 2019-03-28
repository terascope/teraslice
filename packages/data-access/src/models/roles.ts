import * as es from 'elasticsearch';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import rolesConfig, { GraphQLSchema, Role } from './config/roles';

/**
 * Manager for Roles
*/
export class Roles extends IndexModel<Role> {
    static IndexModelConfig = rolesConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, config: IndexModelOptions) {
        super(client, config, rolesConfig);
    }
}

export { Role };
