import * as es from 'elasticsearch';
import { makeISODate } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import viewsConfig, { View } from './config/views';
import { Space } from './config/spaces';
import { Role } from './roles';

/**
 * Manager for Views
 */
export class Views extends IndexModel<View> {
    static IndexModelConfig = viewsConfig;

    constructor(client: es.Client, config: IndexModelOptions) {
        super(client, config, viewsConfig);
    }

    async getViewOfSpace(space: Space, role: Role): Promise<View> {
        const views = await this.findAll(space.views);
        const view = views.find(v => v.roles.includes(role.id));
        if (view) return view;

        // if the view doesn't exist create a non-restrictive default view
        return {
            client_id: role.client_id,
            id: `default-view-for-role-${role.id}`,
            name: `Default View for Role ${role.id}`,
            data_type: space.data_type,
            roles: space.roles,
            created: makeISODate(),
            updated: makeISODate(),
        };
    }

    async removeRoleFromViews(roleId: string) {
        const views = await this.find(`roles: ${roleId}`);
        const promises = views.map(({ id }) => {
            return this._removeFromArray(id, 'roles', roleId);
        });
        await Promise.all(promises);
    }
}

export { View };
