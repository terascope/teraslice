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
        const spaceDoc = await this.spaces.create({ ...args.space, views: [] });
        const space = spaceDoc.id;

        const views = args.views || [];
        const roles: string[] = [];

        const viewDocs = await Promise.all(views.map(async (view) => {
            await this._validateViewInput(view);
            const viewRoles = view.roles || [];

            roles.push(...viewRoles);
            return this.views.create({ ...view, space });
        }));

        spaceDoc.views = viewDocs.map((viewDoc) => viewDoc.id);

        await Promise.all([
            this.attachViewsToSpace({ space, views: spaceDoc.views }),
            this.attachSpaceToRoles({ space, roles })
        ]);

        return {
            space: spaceDoc,
            views: viewDocs,
        };
    }

    /** Associate space to a roles */
    async attachSpaceToRoles(args: { space: string, roles: string[] }): Promise<void> {
        if (!args.roles || !args.roles.length) return;

        const roles = uniq(args.roles);

        if (!args.space) {
            throw new TSError('Missing space id to attach roles to', {
                statusCode: 422
            });
        }

        await Promise.all(roles.map((id) => {
            return this.roles.updateWith(id, {
                script: {
                    source: 'if (!ctx._source.spaces.contains(params.space)) { ctx._source.spaces.add(params.space) }',
                    lang: 'painless',
                    params: {
                        space: args.space,
                    }
                }
            });
        }));
    }

    /** Associate views to space */
    async attachViewsToSpace(args: { space: string, views: string[] }): Promise<void> {
        if (!args.views || !args.views.length) return;

        const views = uniq(args.views);

        if (!args.space) {
            throw new TSError('Missing view id to attach view to', {
                statusCode: 422
            });
        }

        await this.spaces.updateWith(args.space, {
            script: {
                source: `
                    for(int i = 0; i < params.views.length; i++) {
                        if (!ctx._source.views.contains(params.views[i])) {
                            ctx._source.views.add(params.views[i])
                        }
                    }
                `,
                lang: 'painless',
                params: {
                    views,
                }
            }
        });
    }

    /**
     * Create a view
    */
    async createView(args: { view: models.CreateViewInput }) {
        await this._validateViewInput(args.view);

        const view = await this.views.create(args.view);

        await Promise.all([
            this.attachViewsToSpace({ space: view.space, views: [view.id] }),
            this.attachSpaceToRoles({ space: view.space, roles: view.roles })
        ]);
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
    async getDataAccessConfig(args: { username: string, space: string }): Promise<DataAccessConfig> {
        const user = await this.users.findByAnyId(args.username);
        if (!user) {
            throw new TSError(`Unable to find user "${args.username}"`, {
                statusCode: 404
            });
        }

        const roleId = getFirst(user.roles);
        if (!roleId) {
            const msg = `User "${args.username}" is not assigned to any roles`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const role = await this.roles.findById(roleId);

        const hasAccess = await this.roles.hasAccessToSpace(roleId, args.space);
        if (!hasAccess) {
            const msg = `User "${args.username}" does not have access to space "${args.space}"`;
            throw new TSError(msg, { statusCode: 403 });
        }

        const view = await this.views.getViewForRole(roleId, args.space);

        return {
            user: this.users.omitPrivateFields(user),
            view,
            role: role.name,
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
     * The User Model
    */
    user: models.UserModel;

    /**
     * The View Model
    */
    view: models.ViewModel;

    /**
     * The name of the Role
    */
    role: string;
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
