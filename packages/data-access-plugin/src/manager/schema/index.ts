import GraphQLJSON from 'graphql-type-json';
import { GraphQLDateTime } from 'graphql-iso-date';
import * as a from 'apollo-server-express';
import * as d from '@terascope/data-access';
import * as query from './query';
import * as mutation from './mutation';
import { ManagerContext } from '../interfaces';

const resolvers: a.IResolvers<any, ManagerContext> = {
    Query: query.resolvers,
    Mutation: mutation.resolvers,
    JSON: GraphQLJSON,
    DateTime: GraphQLDateTime,
};

export = a.makeExecutableSchema({
    typeDefs: [
        'scalar JSON',
        'scalar DateTime',
        ...d.graphqlSchemas,
        query.schema,
        mutation.schema,
    ],
    resolvers,
    inheritResolversFromInterfaces: true,
});
