import { User, Role } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

export type ResolvedUser = Overwrite<User, {
    role?: Role
}>;
