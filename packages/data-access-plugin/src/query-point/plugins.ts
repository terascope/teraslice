
import { TSError, Logger } from '@terascope/utils';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { getComplexity, ComplexityEstimatorArgs } from 'graphql-query-complexity';
import { separateOperations } from 'graphql';
import * as utils from '../manager/utils';

const formatError = utils.formatError(true);

function isSpace(obj: ComplexityEstimatorArgs) {
    return obj.field.args.length > 0;
}

function queryComplexity(obj: ComplexityEstimatorArgs) {
    if (isSpace(obj)) {
        const size = obj.args.size || 10;
        if (obj.childComplexity) {
            return obj.childComplexity * size;
        }
        return size;
    }
    return 0;
}

function formatNumber(num: number) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// https://github.com/slicknode/graphql-query-complexity/issues/7
export default function makeComplexityPlugin(
    logger: Logger,
    complexitySize: number,
    schema: any,
    userId: string
): ApolloServerPlugin {
    return {
        requestDidStart: () => ({
            didResolveOperation({ request, document }) {
                const complexity = getComplexity({
                    schema,
                    query: request.operationName
                        ? separateOperations(document)[request.operationName]
                        : document,
                    variables: request.variables,
                    estimators: [
                        queryComplexity,
                    ],
                });

                if (complexity >= complexitySize) {
                    logger.error(`user : ${userId} has tried to query with a query complexity of ${complexity} \n${request.query}`);
                    const error = new TSError(
                        // tslint:disable-next-line:max-line-length
                        `The query was rejected due to its complexity score: ${formatNumber(complexity)}. Please reduce the "size" parameter on the queries/joins`,
                        { statusCode: 422 }
                    );
                    throw formatError(error);
                }
            },
        }),
    };
}
