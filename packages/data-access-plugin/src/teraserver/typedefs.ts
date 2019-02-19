import { gql } from 'apollo-server-express';
import { ACLManager } from '@terascope/data-access';

const modelTypeDefinitions = ACLManager.ModelConfigs.map((config) => {
   return config.typeDef;
}).join('\n');

export = gql`
  ${modelTypeDefinitions}

  type Query {
    getUser(id: ID!): UserModel
  }
`;
