
import User from './user';
import Query from './query';
import Geo from './geoType';
// TODO: query and User should probably not be here
export default [
    'scalar DateTime',
    'scalar JSON',
    Query,
    User,
    Geo
];
