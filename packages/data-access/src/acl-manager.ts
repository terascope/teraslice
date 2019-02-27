import { TSError, getFirst, Omit, uniq } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as models from './models';
import { ManagerConfig } from './interfaces';

/**
 * ACL Manager for Data Access Roles, essentially a
 * high level abstraction of Spaces, Users, Roles, and Views
*/
export class ACLManager {
    static GraphQLSchema = `
        input CreateSpaceInput {
            name: String!
            description: String
            metadata: JSON
        }

        input CreateSpaceViewInput {
            name: String!
            description: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            metadata: JSON
        }

        input CreateDefaultViewInput {
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
            metadata: JSON
        }

        type CreateSpaceResult {
            space: Space!,
            views: [View]!
        }

        type DataAccessConfig {
            user_id: String!
            role_id: String!
            view: View!
        }

        type Query {
            authenticateUser(username: String, password: String, api_token: String): User!
            findUser(id: ID!): PublicUser!
            findUsers(query: String): [PublicUser]!

            findRole(id: ID!): Role!
            findRoles(query: String): [Role]!

            findSpace(id: ID!): Space!
            findSpaces(query: String): [Space]!

            findView(id: ID!): View!
            findViews(query: String): [View]!

            getViewForSpace(api_token: String!, space: String!): DataAccessConfig!
        }

        type Mutation {
            createUser(user: CreateUserInput!, password: String!): User!
            updateUser(user: UpdateUserInput!): User!
            updatePassword(id: ID!, password: String!): Boolean!
            removeUser(id: ID!): Boolean!

            createRole(role: CreateRoleInput!): Role!
            updateRole(role: UpdateRoleInput!): Role!
            removeRole(id: ID!): Boolean!

            createView(view: CreateViewInput!): View!
            updateView(view: UpdateViewInput!): View!
            removeView(id: ID!): Boolean!

            createSpace(space: CreateSpaceInput!, views: [CreateSpaceViewInput], defaultView: CreateSpaceViewInput): CreateSpaceResult!
            updateSpace(space: UpdateSpaceInput!): Space!
            removeSpace(id: ID!): Boolean!
        }
    `;

    private readonly roles: models.Roles;
    private readonly spaces: models.Spaces;
    private readonly users: models.Users;
    private readonly views: models.Views;

    constructor(client: es.Client, config: ManagerConfig) {
        this.roles = new models.Roles(client, config);
        this.spaces = new models.Spaces(client, config);
        this.users = new models.Users(client, config);
        this.views = new models.Views(client, config);
    }

     /**
     * Initialize all index stores
     */
    async initialize() {
        await Promise.all([
            this.roles.initialize(),
            this.spaces.initialize(),
            this.users.initialize(),
            this.views.initialize(),
        ]);
    }

    /**
     * Shutdown all index stores
     */
    async shutdown() {
        await Promise.all([
            this.roles.shutdown(),
            this.spaces.shutdown(),
            this.users.shutdown(),
            this.views.shutdown(),
        ]);
    }

    /**
     * Authenticate user with username and password, or an api_token
     */
    async authenticateUser(args: { username?: string, password?: string, api_token?: string }): Promise<models.PrivateUserModel> {
        if (args.username && args.password) {
            return this.users.authenticate(args.username, args.password);
        }

        if (args.api_token) {
            return this.users.findByToken(args.api_token);
        }

        throw new TSError('Missing user authentication fields, username, password, or api_token', {
            statusCode: 401
        });
    }

    /**
     * Find user by id
    */
    async findUser(args: { id: string }) {
        return this.users.findById(args.id);
    }

    /**
     * Find all users by a given query
    */
    async findUsers(args: { query?: string } = {}) {
        return this.users.find(args.query);
    }

    /**
     * Create a user
    */
    async createUser(args: { user: models.CreateUserInput, password: string }) {
        await this._validateUserInput(args.user);

        return this.users.createWithPassword(args.user, args.password);
    }

    /**
     * Update user without password
     *
     * This cannot include private information
    */
    async updateUser(args: { user: models.UpdateUserInput }): Promise<models.UserModel> {
        await this._validateUserInput(args.user);

        // @ts-ignore
        await this.users.update(args.user);
        return this.users.findById(args.user.id);
    }

    /**
     * Update user with password
    */
    async updatePassword(args: { id: string, password: string }): Promise<boolean> {
        await this.users.updateWithPassword(args.id, args.password);
        return true;
    }

    /**
     * Remove user by id
    */
    async removeUser(args: { id: string }): Promise<boolean> {
        const exists = await this.users.exists(args.id);
        if (!exists) return false;

        await this.users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
    */
    async findRole(args: { id: string }) {
        return this.roles.findById(args.id);
    }

    /**
     * Find roles by a given query
    */
    async findRoles(args: { query?: string } = {}) {
        return this.roles.find(args.query);
    }

    /**
     * Create a role
    */
    async createRole(args: { role: models.CreateRoleInput }) {
        await this._validateRoleInput(args.role);

        return this.roles.create(args.role);
    }

    /**
     * Update a role
    */
    async updateRole(args: { role: models.UpdateRoleInput }) {
        await this._validateRoleInput(args.role);

        await this.roles.update(args.role);
        return this.roles.findById(args.role.id);
    }

    /**
     * Remove role and remove from any associated views or users
    */
    async removeRole(args: { id: string }) {
        const exists = await this.roles.exists(args.id);
        if (!exists) return false;

        await Promise.all([
            this.views.removeRoleFromViews(args.id),
            this.users.removeRoleFromUsers(args.id),
            this.roles.deleteById(args.id),
        ]);

        return true;
    }

    /**
     * Find space by id
    */
    async findSpace(args: { id: string }) {
        return this.spaces.findById(args.id);
    }

    /**
     * Find spaces by a given query
    */
    async findSpaces(args: { query?: string } = {}) {
        return this.spaces.find(args.query);
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
    */
    async createSpace(args: { space: CreateSpaceInput, views?: CreateSpaceViewInput[], defaultView?: CreateDefaultViewInput }) {
        const views = args.views || [];
        const roles = await this._validateViewsInput(views);

        let defaultView: models.ViewModel|undefined = undefined;

        const spaceDoc = await this.spaces.create({
            ...args.space,
            views: [],
        });

        const space = spaceDoc.id;

        if (args.defaultView) {
            const {
                includes,
                excludes,
                constraint,
                prevent_prefix_wildcard,
                metadata
            } = args.defaultView;

            defaultView = await this.views.create({
                name: `Default View for Space ${space}`,
                space,
                roles: [],
                includes,
                excludes,
                constraint,
                prevent_prefix_wildcard,
                metadata,
            });
        }

        const viewDocs = await Promise.all(views.map(async (view) => {
            return this.views.create({
                ...view, space
            });
        }));

        spaceDoc.views = viewDocs.map((viewDoc) => viewDoc.id);

        if (defaultView) {
            spaceDoc.default_view = defaultView.id;
            viewDocs.push(defaultView);
        }

        await Promise.all([
            this.spaces.update(spaceDoc),
            this.roles.addSpaceToRoles(space, roles),
        ]);

        return {
            space: spaceDoc,
            views: viewDocs,
        };
    }

    /**
     * Update a space
    */
    async updateSpace(args: { space: models.UpdateSpaceInput }) {
        await this._validateSpaceInput(args.space);

        await this.spaces.update(args.space);
        return this.spaces.findById(args.space.id);
    }

    /**
     * Remove a space by id, this will clean up any associated views and roles
     */
    async removeSpace(args: { id: string }) {
        try {
            const space = await this.spaces.findById(args.id);

            if (space.default_view) {
                space.views.push(space.default_view);
            }

            await Promise.all([
                this.roles.removeSpaceFromRoles(args.id),
                this.views.deleteAll(space.views),
                this.spaces.deleteById(args.id),
            ]);
        } catch (err) {
            if (err && err.statusCode === 404) {
                return false;
            }
            throw err;
        }

        return true;
    }

    /**
     * Find view by id
    */
    async findView(args: { id: string }) {
        return this.views.findById(args.id);
    }

    /**
     * Find views by a given query
    */
    async findViews(args: { query?: string } = {}) {
        return this.views.find(args.query);
    }

    /**
     * Create a view, this will attach to the space and the role
    */
    async createView(args: { view: models.CreateViewInput }) {
        await this._validateViewInput(args.view);

        const roles = args.view.roles || [];

        if (roles.length) {
            const rolesQuery = roles.join(' OR ');
            const count = await this.views.count(`space:"${args.view.space}" AND roles:(${rolesQuery})`);
            if (count > 0) {
                throw new TSError('A Role can only exist in a space once', {
                    statusCode: 422
                });
            }
        }

        const view = await this.views.create(args.view);

        await Promise.all([
            this.spaces.linkViews(view.space, view.id),
            this.roles.addSpaceToRoles(view.space, view.roles)
        ]);
    }

    /**
     * Update a view, this will attach to the space and the role
    */
    async updateView(args: { view: models.UpdateViewInput }) {
        const { view } = args;
        await this._validateViewInput(view);

        const roles = view.roles || [];

        if (roles.length) {
            const rolesQuery = roles.join(' OR ');

            const count = await this.views.count(`space:"${view.space}" AND roles:(${rolesQuery})`);
            if (count > 0) {
                throw new TSError('A Role can only exist in a space once', {
                    statusCode: 422
                });
            }
        }

        let oldSpace: string|undefined;
        if (args.view.space) {
            const currentView = await this.views.findById(view.id);
            oldSpace = currentView.space;
        }

        await this.views.update(args.view);

        if (args.view.space) {
            if (oldSpace && oldSpace !== args.view.space) {
                await Promise.all([
                    this.spaces.unlinkViews(oldSpace, view.id),
                    this.spaces.linkViews(view.space, view.id)
                ]);
            }

            await this.roles.addSpaceToRoles(view.space, view.roles);
        }

        return this.views.findById(args.view.id);
    }

    /**
     * Remove views and remove from any associated spaces
    */
    async removeView(args: { id: string }) {
        const exists = await this.views.exists(args.id);
        if (!exists) return false;

        await this.spaces.removeViewFromSpaces(args.id);
        await this.views.deleteById(args.id);
        return true;
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { api_token: string, space: string }): Promise<DataAccessConfig> {
        const user = await this.authenticateUser(args);

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${user.username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const [role, space] = await Promise.all([
            this.roles.findById(roleId),
            this.spaces.findByAnyId(args.space),
        ]);

        const hasAccess = await this.roles.hasAccessToSpace(role, space.id);
        if (!hasAccess) {
            const msg = `User "${user.username}" does not have access to space "${space.id}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const view = await this.views.getViewForRole(roleId, space.id, space.default_view);

        return {
            user_id: user.id,
            role_id: role.id,
            space_id: space.id,
            space_metadata: space.metadata || {},
            view
        };
    }

    private async _validateUserInput(user: Partial<models.UserModel>) {
        if (!user) {
            throw new TSError('Invalid User Input', {
                statusCode: 422
            });
        }

        if (this.users.isPrivateUser(user)) {
            const fields = models.Users.PrivateFields.join(', ');
            throw new TSError(`Cannot update restricted fields, ${fields}`, {
                statusCode: 422,
            });
        }

        if (user.roles) {
            const exists = await this.roles.exists(user.roles);
            if (!exists) {
                const rolesStr = user.roles.join(', ');
                throw new TSError(`Missing roles with user, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateSpaceInput(space: Partial<models.SpaceModel>) {
        if (!space) {
            throw new TSError('Invalid Space Input', {
                statusCode: 422
            });
        }

        if (space.views) {
            space.views = uniq(space.views);

            const exists = await this.views.exists(space.views);
            if (!exists) {
                const viewsStr = space.views.join(', ');
                throw new TSError(`Missing views with space, ${viewsStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateRoleInput(role: Partial<models.RoleModel>) {
        if (!role) {
            throw new TSError('Invalid Role Input', {
                statusCode: 422
            });
        }

        if (role.spaces) {
            role.spaces = uniq(role.spaces);

            const exists = await this.spaces.exists(role.spaces);
            if (!exists) {
                const rolesStr = role.spaces.join(', ');
                throw new TSError(`Missing spaces with role, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    private async _validateViewInput(view: Partial<models.ViewModel>) {
        if (!view) {
            throw new TSError('Invalid View Input', {
                statusCode: 422
            });
        }

        if (view.roles) {
            view.roles = uniq(view.roles);

            const exists = await this.roles.exists(view.roles);
            if (!exists) {
                const rolesStr = view.roles.join(', ');
                throw new TSError(`Missing roles with view, ${rolesStr}`, {
                    statusCode: 422
                });
            }
        }
    }

    /**
     * Validate views and make sure they only have a role once
     *
     * @returns a list of unique role ids
     */
    private async _validateViewsInput(views: Partial<models.ViewModel>[]): Promise<string[]> {
        if (!views || !views.length) return [];

        const roles: string[] = [];

        for (const view of views) {
            await this._validateViewInput(view);
            if (!view.roles) continue;

            for (const role of view.roles) {
                if (roles.includes(role)) {
                    throw new TSError('A Role can only exist in a space once', {
                        statusCode: 422
                    });
                } else {
                    roles.push(role);
                }
            }
        }

        return roles;
    }
}

type CreateSpaceInput = Omit<models.CreateSpaceInput, 'views'>;
type CreateSpaceViewInput = Omit<models.CreateViewInput, 'space'>;
type CreateDefaultViewInput = Omit<models.CreateViewInput, 'name'|'description'|'space'|'roles'>;

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and QueryAccess
*/
export interface DataAccessConfig {
    /**
     * The id of the user authenticated
    */
    user_id: string;

    /**
     * The id of the Role used
    */
    role_id: string;

    /**
     * The id of the space
    */
    space_id: string;

    /**
     * The space metadata
    */
    space_metadata: any;

    /**
     * The authenticated user's view of the space
    */
    view: models.ViewModel;
}

export const graphqlQueryMethods: (keyof ACLManager)[] = [
    'authenticateUser',
    'findUser',
    'findUsers',
    'findRole',
    'findRoles',
    'findSpace',
    'findSpaces',
    'findView',
    'findViews',
    'getViewForSpace',
];

export const graphqlMutationMethods: (keyof ACLManager)[] = [
    'createUser',
    'updateUser',
    'updatePassword',
    'removeUser',
    'createRole',
    'updateRole',
    'removeRole',
    'createSpace',
    'updateSpace',
    'removeSpace',
    'updateView',
    'removeView',
];

export const graphqlSchemas = [
    ACLManager.GraphQLSchema,
    models.Roles.GraphQLSchema,
    models.Spaces.GraphQLSchema,
    models.Users.GraphQLSchema,
    models.Views.GraphQLSchema,
];
