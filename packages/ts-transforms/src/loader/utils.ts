
import _ from 'lodash';
import graphlib from 'graphlib';
import { Logger } from '@terascope/utils';
import { OperationsManager } from '../index';
import shortid from 'shortid';

import {
    OperationConfig,
    ValidationResults,
    NormalizedFields,
    ExtractionProcessingDict,
    StateDict,
    OperationConfigInput,
    SelectorConfig,
    ExtractionConfig,
    PostProcessConfig
} from '../interfaces';

const  { Graph, alg: { topsort, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[], opsManager: OperationsManager, logger: Logger) {
    const graph = new Graph();
    const tagMapping: StateDict = {};
    const graphEdges: StateDict = {};

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
            if (matchingTags == null) {
                throw new Error(`rule attempts to follow a tag that doesn't exist: ${JSON.stringify(graph.node(id))}`);
            }
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
    const normalizedConfig = normalizeConfig(configListOrder, opsManager, tagMapping);
    const results = createResults(normalizedConfig);
    validateOtherMatchRequired(results.extractions, logger);
    return results;
}

function findFields(config:OperationConfig, configList: OperationConfig[], tagMapping: StateDict): NormalizedFields {
    const targetField = config.target_field;
    const identifier = config.follow || config.__id;
    const nodeIds: string[] = tagMapping[identifier];
    let soureField: string[] = [];
    const pipeline: string[] = [];

    configList
        .filter(obj => nodeIds.includes(obj.__id) && _.has(obj, 'target_field'))
        .forEach(obj => {
            soureField.push(obj.target_field as string);
            const pipelineName = obj.__pipeline || obj.selector;
            pipeline.push(pipelineName as string);
        });
    soureField = _.uniq(soureField);
    if (soureField === undefined || soureField.length === 0) throw new Error(`could not find source field for config ${JSON.stringify(config)}`);
    // @ts-ignore
    return { targetField, soureField, pipeline };
}

function normalizeConfig(configList: OperationConfig[], opsManager: OperationsManager, tagMapping: StateDict): OperationConfig[] {
    const results: OperationConfig[] = [];

    return configList.reduce((list, config) => {
        if (hasPostProcess(config)) {
            // we search inside the list of altered normalized configs.
            // This works becuase topsort orders them
            const { soureField, targetField, pipeline } = findFields(config, list, tagMapping);
            if (isOneToOne(opsManager, config)) {
                const results = createMatchingConfig(soureField, targetField, config, pipeline, tagMapping);
                list.push(...results);
            } else {
                config.__pipeline = pipeline[0];
                config.source_fields = soureField;
                if (targetField && !Array.isArray(targetField)) {
                    config.target_field = targetField;
                } else {
                    checkForTarget(config);
                }
                list.push(config);
            }
        } else {
            list.push(config);
        }
        return list;
    }, results);
}

function createMatchingConfig(fields: string[], targetField: undefined|string|string[], config: OperationConfig, pipeline: string[], tagMapping: StateDict): OperationConfig[] {
    // we clone the original to preserve the __id in reference to tag mappings and the like
    const original = _.cloneDeep(config);

    return fields.map((source, index) => {
        let resultsObj: Partial<OperationConfig> = {};

        let pipelineConfig = {};
        if (pipeline.length > 0) {
            pipelineConfig = pipeline.length > 0 ? { __pipeline: pipeline.shift() } : { __pipeline: config.selector };
        }

        if (index === 0) {
            resultsObj = Object.assign(original, pipelineConfig);
        } else {
            resultsObj = Object.assign({}, config, { __id: shortid.generate() }, pipelineConfig);
            if (resultsObj.tags) {
                resultsObj.tags.forEach((tag) => {
                    if (!tagMapping[tag]) {
                        tagMapping[tag] = [];
                    }
                    tagMapping[tag].push(resultsObj.__id as string);
                });
            }
        }

        if (!resultsObj['source_field']) resultsObj['source_field'] = source;
        if (targetField === undefined) {
            resultsObj['target_field'] = source;
        } else if (Array.isArray(targetField)) {
            resultsObj['target_field'] = targetField[index];
        } else {
            resultsObj['target_field'] = targetField;
        }

        checkForSource(resultsObj as OperationConfig);
        checkForTarget(resultsObj as OperationConfig);
        return resultsObj as OperationConfig;
    });
}

function validateOtherMatchRequired(configDict: ExtractionProcessingDict, logger: Logger) {
    _.forOwn(configDict, (opsList, selector) => {
        const hasMatchRequired = opsList.find(op => !!op.other_match_required) != null;
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

function isOneToOne(opsManager: OperationsManager, config: OperationConfig): boolean {
    if (isOnlySelector(config)) return true;
    const processType = config.validation || config.post_process || 'extraction';
    const Operation = opsManager.getTransform(processType as string);
    return Operation.cardinality === 'one-to-one';
}

function checkForTarget(config: OperationConfig) {
    if (!config.target_field) {
        throw new Error(`could not find target fields for config ${JSON.stringify(config)}`);
    }
}

type Config = OperationConfig|OperationConfigInput;
// FIXME: look to remove
export function isPrimaryConfig(config: Config) {
    return hasSelector(config) && !isPostProcessType(config, 'selector');
}

export function needsDefaultSelector(config: Config) {
    return !hasSelector(config) && !hasFollow(config);
}

function isPrimarySelector(config:Config) {
    return hasSelector(config) && !hasPostProcess(config);
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

export function isDeprecatedCompactConfig(config: Config): boolean {
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

function createResults(list: OperationConfig[]): ValidationResults {
    const results: ValidationResults = {
        selectors: [],
        extractions: {},
        postProcessing: {},
        output: {
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

        if (hasOutputRestrictions(config)) {
            const key = config.target_field || config.source_field;
            output.restrictOutput[key as string] = true;
        }

        if (hasMatchRequirements(config)) {
            const key = config.target_field || config.source_field;
            output.matchRequirements[key as string] = config.selector as string;
        }

        if (isPrimarySelector(config)) {
            currentSelector = config.selector;
            if (!duplicateListing[config.selector as string]) {
                duplicateListing[config.selector as string] = true;
                results.selectors.push(config as SelectorConfig);
            }
        }

        if (hasPrimaryExtractions(config)) {
            if (!results.extractions[currentSelector as string]) {
                results.extractions[currentSelector as string] = [];
            }
            config.mutate = false;
            results.extractions[currentSelector as string].push(config as ExtractionConfig);
        }

        if (hasPostProcess(config)) {
            if (config.__pipeline) currentSelector = config.__pipeline;
            if (!results.postProcessing[currentSelector as string]) {
                results.postProcessing[currentSelector as string] = [];
            }
            if (isPostProcessType(config, 'extraction')) {
                if (config.mutate == null) config.mutate = true;
            }
            results.postProcessing[currentSelector as string].push(config as PostProcessConfig);
        }
    });

    return results;
}
