
import { IResolvers } from 'apollo-server-express';
import { DataAccessConfig } from '@terascope/data-access';
import elasticsearchApi from '@terascope/elasticsearch-api';
import { Logger, get } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { getESClient } from '../../utils';
import { SpacesContext } from '../interfaces';
import User from './user';
import Misc from './misc';
import Query from './query';

const defaultResolvers = {
    ...Misc,
    ...Query,
    ...User
} as IResolvers<any, SpacesContext>;

export {
    defaultResolvers,
    createResolvers
 };

// TODO: deal with auth like manager/query
// TODO: if fields are not one-to-one mapping then we need to add a resolver for it
function createResolvers(viewList: DataAccessConfig[], logger: Logger, context: Context) {
    viewList.forEach((view) => {
        console.log('internal view', view)
        const esClient = getESClient(context, get(view, 'search_config.connection', 'default'));
        const client = elasticsearchApi(esClient, logger);
        console.log('i should be altering Query', view.endpoint)
        Query.Query[view.endpoint] = (root: any, args: any, ctx: any) => {
            console.log(`inside resolver for ${view.endpoint}`);
            console.log('root', root);
            console.log('args', args);
            console.log('ctx', ctx);
            return client.search({ index: 'testdata', q: '*' });
        };
    });

    return {
        ...Misc,
        ...Query,
        ...User
    } as IResolvers<any, SpacesContext>;
}
