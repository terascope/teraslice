import { TSError, getFirst, DataEntity } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
*/
export class ACLManager {
    readonly roles: models.Roles;
    readonly spaces: models.Spaces;
    readonly users: models.Users;
    readonly views: models.Views;

    constructor(client: es.Client, config: ManagerConfig) {
        this.roles = new models.Roles(client, config);
        this.spaces = new models.Spaces(client, config);
        this.users = new models.Users(client, config);
        this.views = new models.Views(client, config);
    }

    async initialize() {
        await Promise.all([
            this.roles.initialize(),
            this.spaces.initialize(),
            this.users.initialize(),
            this.views.initialize(),
        ]);
    }

    async shutdown() {
        await Promise.all([
            this.roles.shutdown(),
            this.spaces.shutdown(),
            this.users.shutdown(),
            this.views.shutdown(),
        ]);
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getDataAccessConfig(username: string, spaceId: string): Promise<DataAccessConfig> {
        const user = await this.users.findByUsername(username);
        if (!user) {
            throw new TSError(`Unable to find user "${username}"`, {
                statusCode: 404
            });
        }

        const space = await this.spaces.findByAnyId(spaceId);

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const role = await this.roles.findById(roleId);

        const hasAccess = await this.roles.hasAccessToSpace(roleId, space.id);
        if (!hasAccess) {
            const msg = `User "${username}" does not have access to space "${space}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const view = await this.views.getViewForRole(roleId, space.id);

        return {
            user: this.users.omitPrivateFields(user),
            view,
            space: space.name,
            role: role.name,
        };
    }

    // FIXME add more higher level apis...
}

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and QueryAccess
*/
export interface DataAccessConfig {
    /**
     * The User Model
    */
    user: DataEntity<models.PublicUserModel>;

    /**
     * The View Model
    */
    view: DataEntity<models.ViewModel>;

    /**
     * The name of the space
    */
    space: string;

    /**
     * The name of the Role
    */
    role: string;
}
