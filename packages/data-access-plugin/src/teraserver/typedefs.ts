import { gql } from 'apollo-server-express';

export = gql`
  type UserType {
    id: ID

    client_id: Int

    username: String

    firstname: String

    lastname: String

    email: String

    roles: [String]

    api_token: String

    hash: String

    salt: String

    created: String

    updated: String
  }

  type Query {
    getUser(id: ID): UserType
  }
`;
