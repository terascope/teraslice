import * as es from 'elasticsearch';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import rolesConfig, { GraphQLSchema, RoleModel } from './config/roles';

/**
 * Manager for Roles
*/
export class Roles extends IndexModel<RoleModel> {
    static ModelConfig = rolesConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, config: IndexModelOptions) {
        super(client, config, rolesConfig);
    }
}

export { RoleModel };
