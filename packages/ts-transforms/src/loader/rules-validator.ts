
import _ from 'lodash';
import graphlib from 'graphlib';
import { parseConfig } from './utils';
import { OperationConfig, ValidationResults } from '../interfaces';

const  { Graph, alg: { topsort, isAcyclic } } = graphlib;

export default class RulesValidator {
    private configList: OperationConfig[];

    constructor(configList: OperationConfig[]) {
        this.configList = _.clone(configList);
    }

    postProcessValidation() {
         // @ts-ignore
        const graph = new Graph();
        try {
            // @ts-ignore
            topsort();
             // @ts-ignore
            isAcyclic();
        } catch (err) {}
    }

    validate(): ValidationResults {
        const results = parseConfig(this.configList);
        if (results.selectors.length === 0) throw new Error('Invalid configuration file, no selector configurations where found');

        return results;
    }
}
