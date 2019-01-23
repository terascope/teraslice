import * as es from 'elasticsearch';
import { getFirst } from '@terascope/utils';
import { Base, BaseModel } from './base';
import mapping from './mapping/views';
import { ManagerConfig } from '../interfaces';

/**
 * Manager for Views
*/
export class Views extends Base<ViewModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, {
            version: 1,
            name: 'views',
            namespace: config.namespace,
            indexSchema: {
                version: 1,
                mapping,
            }
        });
    }

    async getViewForRole(roleId: string, space: string) {
        const query = `roles:"${roleId}" AND space:"${space}"`;
        return getFirst(await this.find(query, 1));
    }
}

/**
 * The definition of a View model
 *
*/
export interface ViewModel extends BaseModel {
    /**
     * Name of the view
    */
    name: string;

    /**
     * Description of the view usage
    */
    description?: string;

    /**
     * The associated space
    */
    space: string;

    /**
     * The associated roles
    */
    roles: string[];

    /**
     * Fields to exclude
    */
    excludes?: string[];

    /**
     * Fields to include
    */
    includes?: string[];

    /**
     * Constraint for queries and filtering
    */
    constraint?: string;
}
