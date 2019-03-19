import * as es from 'elasticsearch';
import { makeISODate } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import viewsConfig, { View, GraphQLSchema } from './config/views';
import { Space } from './config/spaces';

/**
 * Manager for Views
*/
export class Views extends IndexModel<View> {
    static IndexModelConfig = viewsConfig;
    static GraphQLSchema = GraphQLSchema;

    constructor(client: es.Client, config: IndexModelOptions) {
        super(client, config, viewsConfig);
    }

    async getViewOfSpace(space: Space, roleId: string): Promise<View> {
        const views = await this.findAll(space.views);
        const view = views.find((view) => view.roles.includes(roleId));
        if (view) return view;

        // if the view doesn't exist create a non-restrictive default view
        return {
            id: `default-view-for-role-${roleId}`,
            name: `Default View for Role ${roleId}`,
            data_type: space.data_type,
            roles: space.roles,
            created: makeISODate(),
            updated: makeISODate(),
        };
    }

    async removeRoleFromViews(roleId: string) {
        const views = await this.find(`roles: ${roleId}`);
        const promises = views.map(({ id }) => {
            return this.removeFromArray(id, 'roles', roleId);
        });
        await Promise.all(promises);
    }
}

export { View };
