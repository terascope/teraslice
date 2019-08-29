import * as es from 'elasticsearch';
import { makeISODate, TSError } from '@terascope/utils';
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

    async checkForViewConflicts(space: Partial<Space>): Promise<void> {
        const views = await this.findAll(space.views);
        if (!views || !views.length) return;

        // reverse the views list so the errors make more sense
        for (const view of views.reverse()) {
            const errPrefix = `Unable to assign View "${view.name}" as it has`;
            if (view.client_id !== space.client_id) {
                throw new TSError(`${errPrefix} Client ID conflict with the Space`, {
                    statusCode: 409,
                });
            }

            if (view.data_type && space.data_type && view.data_type !== space.data_type) {
                throw new TSError(`${errPrefix} DataType conflict with the Space`, {
                    statusCode: 409,
                });
            }

            if (view.roles && view.roles.length) {
                const hasConflict = views.some((v) => {
                    if (!v.roles) return false;
                    if (v.id === view.id) return false;
                    return v.roles.some((roleId) => view.roles.includes(roleId));
                });

                if (hasConflict) {
                    throw new TSError(`${errPrefix} Role conflicts with existing Views`, {
                        statusCode: 409,
                    });
                }
            }
        }
    }

    async getViewOfSpace(space: Space, role: Role): Promise<View> {
        const views = await this.findAll(space.views);
        const view = views.find((v) => v.roles.includes(role.id));
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
        const promises = views.map(({ id }) => this._removeFromArray(id, 'roles', roleId));
        await Promise.all(promises);
    }
}

export { View };
