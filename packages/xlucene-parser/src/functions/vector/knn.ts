import { KNNQuery, xLuceneVariables } from '@terascope/types';
import { isInteger, getVector } from '@terascope/utils';
import type { Term, FunctionDefinition } from '../../interfaces.js';
import { getFieldValue } from '../../utils.js';

function validate(params: Term[], variables: xLuceneVariables) {
    const kValueNode = params.find((node) => node.field === 'k');
    const vectorValueNode = params.find((node) => node.field === 'vector');

    if (kValueNode == null) {
        throw new TypeError('Invalid knn query, need to specify a "k" parameter');
    }

    if (vectorValueNode == null) {
        throw new TypeError('Invalid knn query, need to specify a "vector" parameter');
    }

    const kValue = getFieldValue<string>(kValueNode.value, variables);
    const vectorValue = getFieldValue<string>(vectorValueNode.value, variables);

    if (!isInteger(kValue)) {
        throw new TypeError('Invalid knn query, the "k" parameter must be an integer');
    }

    return {
        k: kValue,
        vector: getVector(vectorValue)
    };
}

const knnSearch: FunctionDefinition = {
    name: 'knn',
    version: '1',
    create({
        node, variables,
    }) {
        if (!node.field || node.field === '*') {
            throw new Error('Field for knn cannot be empty or "*"');
        }
        const { k, vector } = validate(node.params as Term[], variables);

        function toElasticsearchQuery(field: string) {
            const query: KNNQuery = {
                knn: {
                    [field]: {
                        vector,
                        k
                    }
                }
            };

            return { query };
        }

        return {
            match: () => {
                // TODO: look into what it would need to support in process knn lookups
                throw new Error('knn vector searching does not support matching');
            },
            toElasticsearchQuery
        };
    }
};

export default knnSearch;
