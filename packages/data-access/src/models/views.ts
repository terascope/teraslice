import { getFirst } from '@terascope/utils';
import { ModelFactory, BaseModel } from './base';

/**
 * Manager for Views
*/
export class Views extends ModelFactory<ViewModel> {
    async getViewForRole(roleId: string, space: string): Promise<ViewModel> {
        const query = `roles:"${roleId}" AND space:"${space}"`;
        return getFirst(await this.search(query, 1));
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
