import DataType from './data-type';
import Mutation from './mutation';
import Query from './query';
import Role from './role';
import Space from './space';
import User from './user';
import View from './view';

export default [
    'scalar JSON',
    'scalar DateTime',
    'scalar DataTypeConfig',
    DataType,
    Role,
    Space,
    User,
    View,
    Query,
    Mutation,
];
