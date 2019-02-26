
import _ from 'lodash';
import graphlib from 'graphlib';
import { Logger } from '@terascope/utils';
import {
    OperationConfig,
    ValidationResults,
    NormalizedFields,
    ConfigProcessingDict
} from '../interfaces';

const  { Graph, alg: { topsort, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[], logger: Logger) {
    const graph = new Graph();
    const tagMapping = {};
    const graphEdges = {};

    function normalizeConfig(config: ParsedConfig): OperationConfig {
        if (isPostProcessConfig(config)) {
            if (config.source_field) {
                if (!config.target_field) config.target_field = config.source_field;
            } else {
                const { soureField, targetField } = findFields(config);
                config.source_field = soureField;
                config.target_field = targetField;
            }
        }
        return config;
    }

    interface ExtractionWrapper {
        __extractions: OperationConfig[];
    }

    type ParsedConfig = OperationConfig & ExtractionWrapper;

    function findFields(config:ParsedConfig): NormalizedFields {
        let searchingConfig = config;
        let soureField = null;
        let targetField = config.target_field;

        while (soureField === null) {
            const nodeId = tagMapping[searchingConfig.follow as string];
            const resultsConfig: ParsedConfig = graph.node(nodeId);
            let sourceConfig;
            if (resultsConfig.__extractions) {
                sourceConfig = resultsConfig.__extractions.find((obj) => obj.tag === searchingConfig.follow);
            } else {
                sourceConfig = resultsConfig;
            }

            if (sourceConfig && sourceConfig.target_field) {
                soureField = sourceConfig.target_field;
            } else {
                // @ts-ignore
                searchingConfig = sourceConfig;
            }
        }
        if (!targetField) targetField = soureField;
        return { targetField, soureField };
    }

    function hasOutputRestrictions(config: OperationConfig) {
        return config.output === false && config.validation == null;
    }

    function hasMatchRequirements(config: OperationConfig) {
        return _.has(config, 'other_match_required');
    }

    function hasMultivalue(config: OperationConfig) {
        return _.has(config, 'multivalue');
    }

    function createResults(list: ParsedConfig[]): ValidationResults {
        const results: ValidationResults = {
            selectors: [],
            extractions: {},
            postProcessing: {},
            output: {
                hasMultiValue: false,
                restrictOutput: {},
                matchRequirements: {},
            }
        };
        const output = results.output;
        let currentSelector: undefined|string;

        list.forEach((config) => {

            if (hasMultivalue(config)) {
                output.hasMultiValue = true;
            }

            if (hasOutputRestrictions(config)) {
                const key = config.target_field || config.source_field;
                output.restrictOutput[key as string] = true;
            }

            if (hasMatchRequirements(config)) {
                const key = config.target_field || config.source_field;
                output.matchRequirements[key as string] = config.selector as string;
            }

            if (hasExtractions(config)) {
                // TODO: fix the typing
                results.extractions[currentSelector as string] = config.__extractions;
            }

            if (isPrimaryConfig(config)) {
                currentSelector = config.selector;
                results.selectors.push(config);
            }

            if (isPostProcessConfig(config)) {
                if (!results.postProcessing[currentSelector as string]) {
                    results.postProcessing[currentSelector as string] = [config];
                } else {
                    results.postProcessing[currentSelector as string].push(config);
                }
            }
        });

        return results;
    }

    configList.forEach((config) => {
       // TODO: change name
        if (isPrimaryConfig(config)) {
            const selectorNode = `selector:${config.selector}`;
            const extractionNode = `extractions:${config.selector}`;
            if (!graph.hasNode(selectorNode)) {
                graph.setNode(selectorNode, config);
            }
            if (config.source_field) {
                if (!graph.hasNode(extractionNode)) {
                    graph.setNode(extractionNode, { __extractions: [config] });
                    graph.setEdge(selectorNode, extractionNode);
                } else {
                    const extractionList = graph.node(extractionNode);
                    extractionList.__extractions.push(config);
                    graph.setNode(extractionNode, extractionList);
                }
                if (config.tag) {
                    tagMapping[config.tag] = extractionNode;
                }
            }
        } else if (isPostProcessConfig(config)) {
            if (config.tag) {
                if (tagMapping[config.tag]) {
                    throw new Error(`must have unique tag, ${config.tag} is a duplicate`);
                } else {
                    tagMapping[config.tag] = config.__id;
                }
            }
            const id = config.__id as string;

            // config may be out of order so we build edges later
            graph.setNode(id, config);
            if (!graphEdges[config.follow as string]) {
                graphEdges[config.follow as string] = [id];
            } else {
                graphEdges[config.follow as string].push(id);
            }
        }
    });

    // config may be out of order so we build edges later
    _.forOwn(graphEdges, (ids, tag) => {
        // @ts-ignore
        ids.forEach(id => graph.setEdge(tagMapping[tag], id));
    });

    const cycles = findCycles(graph);
    if (cycles.length > 0) {
        const errMsg = 'A cyclic tag => follow sequence has been found, cycles: ';
        const errList: string[] = [];
        cycles.forEach((cycleList) => {
            const list = cycleList.map(id => graph.node(id));
            errList.push(JSON.stringify(list, null, 4));
        });
        throw new Error(`${errMsg}${errList.join(' \n cycle: ')}`);
    }

    const sortList = topsort(graph);
    const configListOrder: ParsedConfig[] = sortList.map(id => graph.node(id));
    configListOrder.forEach(normalizeConfig);
    const results = createResults(configListOrder);
    validateOtherMatchRequired(results.extractions, logger);
    return results;
}

function validateOtherMatchRequired(configDict: ConfigProcessingDict, logger: Logger) {
    _.forOwn(configDict, (opsList, selector) => {
        const hasMatchRequired = opsList.find(op => op.other_match_required === true) !== undefined;
        if (hasMatchRequired && opsList.length === 1) {
            logger.warn(`
            There is only a single extraction for selector ${selector} and it has other_match_required set to true.
            This will return empty results unless the data matches another selector that has reqular extractions
            `.trim());
        }
    });
}

// TODO: review what needs to be exported
export function isPrimaryConfig(config: OperationConfig) {
    if (_.has(config, 'selector') && !config.follow) return true;
    return false;
}

export function isPostProcessConfig(config: OperationConfig): boolean {
    if (_.has(config, 'post_process') || _.has(config, 'validation')) return true;
    return false;
}

function hasExtractions(config: OperationConfig) {
    return _.has(config, '__extractions');
}

// @ts-ignore
function isPostProcessRootConfig(config: OperationConfig) {
    if (!_.has(config, 'follow') && _.has(config, 'selector')) return true;
    return false;
}

export function isSimplePostProcessConfig(config: OperationConfig) {
    if (!_.has(config, 'follow') && isPostProcessConfig(config)) return true;
    return false;
}
