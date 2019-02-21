
import graphlib from 'graphlib';
import { OperationConfig } from '../interfaces';
const  { Graph, alg: { topsort, isAcyclic } } = graphlib;
type RulesType = 'postProcessor';

export default class RulesValidator {
     // @ts-ignore
    private configList: OperationConfig[];
    private type: RulesType;

    constructor(type: RulesType, configList: OperationConfig[]) {
        this.configList = configList;
        this.type = type;
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

    parse() {
        if (this.type === 'postProcessor') {
            return this.postProcessValidation();
        }
    }
}
