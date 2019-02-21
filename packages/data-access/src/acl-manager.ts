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
        }

        input CreateSpaceViewInput {
            name: String!
            description: String
            roles: [String]
            excludes: [String]
            includes: [String]
            constraint: String
            prevent_prefix_wildcard: Boolean
        }

        type CreateSpaceResult {
            space: Space!,
            views: [View]!
        }

        type Query {
            findUser(id: ID!): PublicUser
            findUsers(query: String): [PublicUser]!

            findRole(id: ID!): Role
            findRoles(query: String): [Role]!

            findSpace(id: ID!): Space
            findSpaces(query: String): [Space]!

            findView(id: ID!): View
            findViews(query: String): [View]!
        }

        type Mutation {
            createUser(user: CreateUserInput!, password: String!): User!
            updateUser(user: UpdateUserInput!): User!
            updatePassword(id: ID!, password: String!): Boolean
            removeUser(id: ID!): Boolean

            createRole(role: CreateRoleInput!): Role
            updateRole(role: UpdateRoleInput!): Role

            createSpace(space: CreateSpaceInput!, views: [CreateSpaceViewInput]): CreateSpaceResult
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
     * Find user by id
    */
    findUser(args: { id: string }) {
        return this.users.findByAnyId(args.id);
    }

    /**
     * Find all users by a given query
    */
    findUsers(args: { query?: string } = {}) {
        return this.users.find(args.query || '*');
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
        await this.users.deleteById(args.id);
        return true;
    }

    /**
     * Find role by id
    */
    async findRole(args: { id: string }) {
        return this.roles.findByAnyId(args.id);
    }

    /**
     * Find roles by a given query
    */
    findRoles(args: { query?: string } = {}) {
        return this.roles.find(args.query || '*');
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
     * Find space by id
    */
    async findSpace(args: { id: string }) {
        return this.spaces.findByAnyId(args.id);
    }

    /**
     * Find spaces by a given query
    */
    findSpaces(args: { query?: string } = {}) {
        return this.spaces.find(args.query || '*');
    }

    /**
     * Create space with optional views
     * If roles are specified on any of the views, it will try automatically
     * attached the space to those roles.
    */
    async createSpace(args: { space: CreateSpaceInput, views?: CreateSpaceViewInput[] }) {
        const views = args.views || [];
        const roles = await this._validateViewsInput(views);

        const spaceDoc = await this.spaces.create({
            ...args.space,
            views: []
        });

        const space = spaceDoc.id;

        const viewDocs = await Promise.all(views.map(async (view) => {
            return this.views.create({
                ...view, space
            });
        }));

        spaceDoc.views = viewDocs.map((viewDoc) => viewDoc.id);

        await Promise.all([
            this.spaces.linkViews(space, spaceDoc.views),
            this.roles.linkSpace(space, roles),
        ]);

        return {
            space: spaceDoc,
            views: viewDocs,
        };
    }

    /**
     * Create a view, this will attach to the space and the role
    */
    async createView(args: { view: models.CreateViewInput }) {
        await this._validateViewInput(args.view);

        const roles = args.view.roles || [];
        const rolesQuery = roles.join(' OR ');

        const count = await this.views.count(`space:"${args.view.space}" AND roles:(${rolesQuery})`);
        if (count > 0) {
            throw new TSError('A Role can only exist in a space once', {
                statusCode: 422
            });
        }

        const view = await this.views.create(args.view);

        await Promise.all([
            this.spaces.linkViews(view.space, view.id),
            this.roles.linkSpace(view.space, view.roles)
        ]);
    }

    /**
     * Update a view, this will attach to the space and the role
    */
    async updateView(args: { view: models.UpdateViewInput }) {
        const { view } = args;
        await this._validateViewInput(view);

        const { space: oldSpace } = await this.views.findById(view.id);

        const roles = view.roles || [];
        const rolesQuery = roles.join(' OR ');

        const count = await this.views.count(`space:"${view.space}" AND roles:(${rolesQuery})`);
        if (count > 0) {
            throw new TSError('A Role can only exist in a space once', {
                statusCode: 422
            });
        }

        await this.views.update(args.view);

        if (oldSpace !== args.view.space) {
            await this.spaces.linkViews(view.space, view.id);
        }

        await this.roles.linkSpace(view.space, view.roles);
    }

    /**
     * Find view by id
    */
    async findView(args: { id: string }) {
        return this.views.findByAnyId(args.id);
    }

    /**
     * Find views by a given query
    */
    findViews(args: { query?: string } = {}) {
        return this.views.find(args.query || '*');
    }

    /**
     * Get the User's data access configuration for a "Space"
     */
    async getViewForSpace(args: { api_token: string, space: string }): Promise<DataAccessConfig> {
        if (!args.api_token) {
            throw new TSError('Missing authentication for user', {
                statusCode: 401
            });
        }

        const user = await this.users.findByToken(args.api_token);
        if (!user) {
            throw new TSError('Unable to authenticate user', {
                statusCode: 403
            });
        }

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${user.username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const role = await this.roles.findById(roleId);

        const hasAccess = await this.roles.hasAccessToSpace(roleId, args.space);
        if (!hasAccess) {
            const msg = `User "${user.username}" does not have access to space "${args.space}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const [view] = await Promise.all([
            this.views.getViewForRole(roleId, args.space),
        ]);

        return {
            user_id: user.id,
            role_id: role.id,
            view
        };
    }

    private async _validateUserInput(user: Partial<models.UserModel>) {
        if (!user) {
            throw new TSError('Invalid User Input', {
                statusCode: 422
            });
        }

        if (user.roles && user.roles.length) {
            try {
                await this.roles.findAll(user.roles);
            } catch (err) {
                const rolesStr = user.roles.join(', ');
                throw new TSError(`Missing roles with user, ${rolesStr}`, {
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

        if (role.spaces && role.spaces.length) {
            try {
                await this.spaces.findAll(role.spaces);
            } catch (err) {
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

        if (view.roles && view.roles.length) {
            view.roles = uniq(view.roles);

            try {
                await this.roles.findAll(view.roles);
            } catch (err) {
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
     * The View Model
    */
    view: models.ViewModel;
}

export const graphqlQueryMethods: (keyof ACLManager)[] = [
    'findUser',
    'findUsers',
    'findRole',
    'findRoles',
    'findSpace',
    'findSpaces',
    'findView',
    'findViews',
];

export const graphqlMutationMethods: (keyof ACLManager)[] = [
    'createUser',
    'updateUser',
    'updatePassword',
    'removeUser',
    'createSpace',
    'createRole',
    'updateRole',
];

export const graphqlSchemas = [
    ACLManager.GraphQLSchema,
    models.Roles.GraphQLSchema,
    models.Spaces.GraphQLSchema,
    models.Users.GraphQLSchema,
    models.Views.GraphQLSchema,
];
