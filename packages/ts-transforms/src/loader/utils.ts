
import _ from 'lodash';
import graphlib from 'graphlib';
import { Logger } from '@terascope/utils';
import { OperationsManager } from '../index';
import shortid from 'shortid';

import {
    OperationConfig,
    ValidationResults,
    NormalizedFields,
    ConfigProcessingDict,
    StateDict,
    UnParsedConfig
} from '../interfaces';

const  { Graph, alg: { topsort, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[], opsManager: OperationsManager, logger: Logger) {
    const graph = new Graph();
    const tagMapping: StateDict = {};
    const graphEdges: StateDict = {};

    function normalizeConfig(configList: OperationConfig[]): OperationConfig[] {
        const results: OperationConfig[] = [];

        return configList.reduce((list, config) => {
            if (hasPostProcess(config)) {
                if (config.source_field) {
                    if (!config.target_field) config.target_field = config.source_field;
                    list.push(config);
                } else {
                    // we search inside the list of altered normalized configs.
                    // This works becuase topsort orders them
                    const { soureField, targetField } = findFields(config, list);
                    if (isOneToOne(opsManager, config)) {
                        const results = createMatchingConfig(soureField, targetField, config);
                        list.push(...results);
                    } else {
                        config.source_fields = soureField;
                        if (targetField && !Array.isArray(targetField)) {
                            config.target_field = targetField;
                        } else {
                            checkForTarget(config);
                        }
                        list.push(config);
                    }
                }
            } else {
                list.push(config);
            }
            return list;
        }, results);
    }

    function createMatchingConfig(fields: string[], targetField: undefined|string|string[], config: OperationConfig): OperationConfig[] {
        // we clone the original to preserve the __id in reference to tag mappings and the like
        const original = _.cloneDeep(config);
        return fields.map((source, index) => {
            // @ts-ignore
            let resultsObj: OperationConfig = {};
            if (index === 0) {
                resultsObj = original;
            } else {
                resultsObj = Object.assign({}, config, { __id: shortid.generate() });
                if (resultsObj.tags) {
                    resultsObj.tags.forEach((tag) => {
                        if (!tagMapping[tag]) {
                            tagMapping[tag] = [];
                        }
                        tagMapping[tag].push(resultsObj.__id);
                    });
                }
            }

            resultsObj['source_field'] = source;
            if (targetField === undefined) {
                resultsObj['target_field'] = source;
            } else if (Array.isArray(targetField)) {
                resultsObj['target_field'] = targetField[index];
            } else {
                resultsObj['target_field'] = targetField;
            }

            checkForSource(resultsObj);
            checkForTarget(resultsObj);
            return resultsObj;
        });
    }

    function isOneToOne(opsManager: OperationsManager, config: OperationConfig): boolean {
        if (isOnlySelector(config)) return true;
        const processType = config.validation || config.post_process || 'extraction';
        const Operation = opsManager.getTransform(processType as string);
        return Operation.cardinality === 'one-to-one';
    }

    function findFields(config:OperationConfig, configList: OperationConfig[]): NormalizedFields {
        const targetField = config.target_field;
        const identifier = config.follow || config.__id;
        const nodeIds: string[] = tagMapping[identifier];

        const targetFieldList = configList
            .filter(obj => nodeIds.includes(obj.__id) && _.has(obj, 'target_field'))
            .map(obj => obj.target_field as string);

        const soureField = _.uniq(targetFieldList);
        if (soureField === undefined || soureField.length === 0) throw new Error(`could not find source field for config ${JSON.stringify(config)}`);
        return { targetField, soureField };
    }

    configList.forEach((config) => {
        const configId = config.__id;

        if (config.tags) {
            config.tags.forEach((tag) => {
                if (!tagMapping[tag]) {
                    tagMapping[tag] = [];
                }
                tagMapping[tag].push(configId);
            });
        }

        if (isPrimaryConfig(config)) {
            const selectorNode = `selector:${config.selector}`;

            if (!graph.hasNode(selectorNode)) {
                graph.setNode(selectorNode, config);
            }

            if (hasPrimaryExtractions(config)) {
                graph.setNode(configId, config);
                graph.setEdge(selectorNode, configId);
            }
        }

        if (hasPostProcess(config)) {
            // config may be out of order so we build edges later
            graph.setNode(configId, config);
            if (!graphEdges[config.follow as string]) {
                graphEdges[config.follow as string] = [configId];
            } else {
                graphEdges[config.follow as string].push(configId);
            }
        }
    });

    // config may be out of order so we build edges after the fact on post processors
    _.forOwn(graphEdges, (ids, key) => {
        ids.forEach((id) => {
            const matchingTags: string[] = tagMapping[key];
            matchingTags.forEach(tag => graph.setEdge(tag, id));
        });
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
    const configListOrder: OperationConfig[] = sortList.map(id => graph.node(id));
    // we are mutating the config to make sure it has all the necessary fields
    const normalizedConfig = normalizeConfig(configListOrder);
    const results = createResults(normalizedConfig);
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

function checkForSource(config: OperationConfig) {
    if (!config.source_field && (config.source_fields == null || config.source_fields.length === 0)) {
        throw new Error(`could not find source fields for config ${JSON.stringify(config)}`);
    }
}

function checkForTarget(config: OperationConfig) {
    if (!config.target_field) {
        throw new Error(`could not find target fields for config ${JSON.stringify(config)}`);
    }
}

type Config = OperationConfig|UnParsedConfig;

export function isPrimaryConfig(config: Config) {
    return hasSelector(config) && !hasFollow(config) && !isPostProcessType(config, 'selector');
}

export function needsDefaultSelector(config: Config) {
    return !hasSelector(config) && !hasFollow(config);
}
function isOnlySelector(config:Config) {
    return hasSelector(config) && !hasExtractions(config) && !hasPostProcess(config);
}

function isPostProcessType(config:Config, type: string) {
    return config.post_process === type;
}

function hasSelector(config: Config) {
    return _.has(config, 'selector');
}

function hasFollow(config: Config) {
    return _.has(config, 'follow');
}

function hasPostProcess(config: Config): boolean {
    return (_.has(config, 'post_process') || _.has(config, 'validation'));
}

export function isOldCompatabilityPostProcessConfig(config: Config): boolean {
    return (!hasFollow(config) && hasPostProcess(config) && hasSelector(config));
}

export function isSimplePostProcessConfig(config: Config) {
    return (!_.has(config, 'follow') && hasPostProcess(config));
}

export function hasExtractions(config: Config) {
    return _.has(config, 'source_field');
}

function hasPrimaryExtractions(config: Config) {
    return hasExtractions(config) && !isPostProcessType(config, 'extraction') && !hasFollow(config);
}

function hasOutputRestrictions(config: Config) {
    return config.output === false && config.validation == null;
}

function hasMatchRequirements(config: Config) {
    return _.has(config, 'other_match_required');
}

function hasMultivalue(config: Config) {
    return _.has(config, 'multivalue');
}

function createResults(list: OperationConfig[]): ValidationResults {
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
    const duplicateListing = {};

    list.forEach((config) => {

        if (duplicateListing[config.__id]) {
            return;
        }
        duplicateListing[config.__id] = true;

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

        if (isPrimaryConfig(config)) {
            if (!duplicateListing[config.selector as string]) {
                duplicateListing[config.selector as string] = true;
                currentSelector = config.selector;
                results.selectors.push(config);
            }
        }

        if (hasPrimaryExtractions(config)) {
            if (!results.extractions[currentSelector as string]) {
                results.extractions[currentSelector as string] = [];
            }
            results.extractions[currentSelector as string].push(config);
        }

        if (hasPostProcess(config)) {
            if (!results.postProcessing[currentSelector as string]) {
                results.postProcessing[currentSelector as string] = [config];
            } else {
                results.postProcessing[currentSelector as string].push(config);
            }
        }
    });

    return results;
}
