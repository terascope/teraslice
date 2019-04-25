import { User, Role } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

export interface CoreProps {
    classes: any;
}

export type ResolvedUser = Overwrite<User, {
    role?: Role
}>;

export type QueryState = {
    from?: number,
    size?: number,
    query?: string,
    sort?: string
};
