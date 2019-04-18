import { IResolvers } from 'apollo-server-express';
import { ManagerContext } from '../interfaces';

import DataType from './data-type';
import Misc from './misc';
import Mutation from './mutation';
import Query from './query';
import Role from './role';
import Space from './space';
import User from './user';
import View from './view';

export default {
    ...DataType,
    ...Misc,
    ...Mutation,
    ...Query,
    ...Role,
    ...Space,
    ...User,
    ...View,
} as IResolvers<any, ManagerContext>;
