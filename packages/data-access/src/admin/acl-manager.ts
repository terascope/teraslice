import * as es from 'elasticsearch';
import { UserModel } from './users';
import { ViewModel } from './views';

/**
 * Manager for Spaces, Users, Roles, and Views
*/
export class ACLManager {
    constructor(client: es.Client) {

    }

    async create() {

    }

    async delete() {

    }

    async get() {

    }

    async update() {

    }
}

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and QueryAccess
*/
export interface DataAccessACL {
    /**
     * The User Model
    */
    user: UserModel;
    /**
     * The View Model
    */
    view: ViewModel;
    /**
     * The name of the Space
    */
    space: string;
    /**
     * The name of the Role
    */
    role: string;
}
