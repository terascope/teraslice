import User from './user';
import Query from './query';
import Geo from './geo-type';

// TODO: query and User should probably not be here
export default ['scalar DateTime', 'scalar JSON', Query, User, Geo];
