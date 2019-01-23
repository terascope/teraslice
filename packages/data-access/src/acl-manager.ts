import { TSError, getFirst } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as models from './models';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
*/
export class ACLManager {
    readonly roles: models.Roles;
    readonly spaces: models.Spaces;
    readonly users: models.Users;
    readonly views: models.Views;

    constructor(client: es.Client) {
        this.roles = new models.Roles(client);
        this.spaces = new models.Spaces(client);
        this.users = new models.Users(client);
        this.views = new models.Views(client);
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
     * Get the User's view of a "Space"
     */
    async getViewForUser(username: string, space: string): Promise<DataAccessConfig> {
        const user = await this.users.findByUsername(username);

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const hasAccess = await this.roles.hasAccessToSpace(roleId, space);
        if (!hasAccess) {
            const msg = `User "${username}" does not have access to space "${space}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const view = await this.views.getViewForRole(roleId, space);

        return {
            user,
            view,
            space,
            role: roleId,
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
    user: models.UserModel;

    /**
     * The View Model
    */
    view: models.ViewModel;

    /**
     * The name of the space
    */
    space: string;

    /**
     * The name of the Role
    */
    role: string;
}
