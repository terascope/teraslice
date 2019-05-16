
import { baseModel } from '../../manager/types/misc';

export default `
    enum UserType {
        USER
        ADMIN
        SUPERADMIN
    }
    type User {
        ${baseModel}
        username: String!
        firstname: String!
        lastname: String!
        email: String
        role: ID
        type: UserType
        api_token: String
    }
`;
