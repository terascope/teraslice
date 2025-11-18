import graphlib from 'graphlib';
import { Logger, cloneDeep, has } from '@terascope/core-utils';
import { nanoid } from 'nanoid';
import { OperationsManager } from '../index.js';

import {
    OperationConfig,
    ValidationResults,
    ExtractionProcessingDict,
    StateDict,
    OperationConfigInput,
    SelectorConfig,
    ExtractionConfig,
    PostProcessConfig,
} from '../interfaces.js';

const {
    Graph,
    alg: { topsort, findCycles },
} = graphlib;

function makeSelectorTag(name: string) {
    return `selector:${name}`;
}

export function parseConfig(
    configList: OperationConfig[],
    opsManager: OperationsManager,
    logger: Logger
) {
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

                if (isPrimaryConfig(config) && !hasPrimaryExtractions(config)) {
                    tagMapping[tag].push(makeSelectorTag(config.selector as string));
                } else {
                    tagMapping[tag].push(configId);
                }
            });
        }

        if (isPrimaryConfig(config)) {
            const selectorNode = makeSelectorTag(config.selector as string);

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
    for (const [key, ids] of Object.entries(graphEdges)) {
        ids.forEach((id) => {
            const matchingTags: string[] = tagMapping[key];
            if (matchingTags == null) {
                throw new Error(`rule attempts to follow a tag that doesn't exist: ${JSON.stringify(graph.node(id))}`);
            }
            matchingTags.forEach((tag) => graph.setEdge(tag, id));
        });
    }

    const cycles = findCycles(graph);

    if (cycles.length > 0) {
        const errMsg = 'A cyclic tag => follow sequence has been found, cycles: ';
        const errList: string[] = [];
        cycles.forEach((cycleList) => {
            const list = cycleList.map((id) => graph.node(id));
            errList.push(JSON.stringify(list, null, 4));
        });
        throw new Error(`${errMsg}${errList.join(' \n cycle: ')}`);
    }

    const sortList = topsort(graph);
    const configListOrder: OperationConfig[] = sortList.map((id) => graph.node(id));
    // we are mutating the config to make sure it has all the necessary fields
    const normalizedConfig = normalizeConfig(configListOrder, opsManager, tagMapping);
    const results = createResults(normalizedConfig);
    validateOtherMatchRequired(results.extractions, logger);

    return results;
}

function normalizeConfig(
    configList: OperationConfig[],
    opsManager: OperationsManager,
    tagMapping: StateDict
): OperationConfig[] {
    const results: OperationConfig[] = [];

    return configList.reduce((list, config) => {
        if (hasPostProcess(config)) {
            const targetField = config.target;
            // we search inside the list of altered normalized configs.
            // This works becuase topsort orders them
            const fieldsConfigs = findConfigs(config, list, tagMapping);
            if (isOneToOne(opsManager, config)) {
                const stuff = createMatchingConfig(fieldsConfigs, config, tagMapping);
                list.push(...stuff);
            } else {
                const [pipeline] = fieldsConfigs.map((obj) => obj.pipeline);
                config.__pipeline = pipeline;
                config.sources = [...new Set(fieldsConfigs.map((obj) => obj.source))];

                if (targetField && !Array.isArray(targetField)) {
                    config.target = targetField;
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

interface FieldSourceConfigs {
    source: string;
    pipeline: string;
}

function findConfigs(
    config: OperationConfig,
    configList: OperationConfig[],
    tagMapping: StateDict
): FieldSourceConfigs[] {
    const identifier = config.follow || config.__id;
    const nodeIds: string[] = tagMapping[identifier];
    const mapping: Record<string, boolean> = {};
    const results: FieldSourceConfigs[] = [];

    configList
        .filter((obj) => {
            let selectorId;
            if (obj.selector) selectorId = makeSelectorTag(obj.selector);

            const foundNode = nodeIds.includes(obj.__id)
                || (selectorId && nodeIds.includes(selectorId));

            return foundNode;
        })
        .forEach((obj) => {
            if (!mapping[obj.__id]) {
                mapping[obj.__id] = true;
                const pipeline = obj.__pipeline || obj.selector;
                results.push({ pipeline: pipeline as string, source: obj.target as string });
            }
        });

    return results;
}

function createMatchingConfig(
    fieldsConfigs: FieldSourceConfigs[],
    config: OperationConfig,
    tagMapping: StateDict
): OperationConfig[] {
    // we clone the original to preserve the __id in reference to tag mappings and the like
    const original = cloneDeep(config);
    return fieldsConfigs.map((obj: FieldSourceConfigs, index: number) => {
        let resultsObj: Partial<OperationConfig> = {};
        const pipelineConfig = { __pipeline: obj.pipeline };

        if (index === 0) {
            resultsObj = Object.assign(original, pipelineConfig);
        } else {
            resultsObj = Object.assign({}, config, { __id: nanoid() }, pipelineConfig);
            if (resultsObj.tags) {
                resultsObj.tags.forEach((tag) => {
                    if (!tagMapping[tag]) {
                        tagMapping[tag] = [];
                    }
                    tagMapping[tag].push(resultsObj.__id as string);
                });
            }
        }

        if (!resultsObj.source) resultsObj.source = obj.source;

        if (config.target === undefined) {
            resultsObj.target = obj.source;
        } else if (Array.isArray(config.target)) {
            resultsObj.target = config.target[index];
        } else {
            resultsObj.target = config.target;
        }

        checkForSource(resultsObj as OperationConfig);
        checkForTarget(resultsObj as OperationConfig);

        return resultsObj as OperationConfig;
    });
}

function validateOtherMatchRequired(configDict: ExtractionProcessingDict, logger: Logger) {
    for (const [selector, opsList] of Object.entries(configDict)) {
        const hasMatchRequired = opsList.find((op) => !!op.other_match_required) != null;

        if (hasMatchRequired && opsList.length === 1) {
            logger.warn(
                `
            There is only a single extraction for selector ${selector} and it has other_match_required set to true.
            This will return empty results unless the data matches another selector that has reqular extractions
            `.trim()
            );
        }
    }
}

function checkForSource(config: OperationConfig) {
    if (!config.source
        && (config.sources == null || config.sources.length === 0)) {
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
    if (!config.target) {
        throw new Error(`could not find target fields for config ${JSON.stringify(config)}`);
    }
}

type Config = OperationConfig | OperationConfigInput;

export function isPrimaryConfig(config: Config) {
    return hasSelector(config) && !hasPostProcess(config);
}

export function needsDefaultSelector(config: Config) {
    return !hasSelector(config) && !hasFollow(config);
}

function isPrimarySelector(config: Config) {
    return hasSelector(config) && !hasPostProcess(config);
}

function isOnlySelector(config: Config) {
    return hasSelector(config) && !hasExtractions(config) && !hasPostProcess(config);
}

function isPostProcessType(config: Config, type: string) {
    return config.post_process === type;
}

function hasSelector(config: Config) {
    return has(config, 'selector');
}

function hasFollow(config: Config) {
    return has(config, 'follow');
}

function hasPostProcess(config: Config): boolean {
    return has(config, 'post_process') || has(config, 'validation');
}

export function isDeprecatedCompactConfig(config: Config): boolean {
    return !hasFollow(config) && hasPostProcess(config) && hasSelector(config);
}

export function isSimplePostProcessConfig(config: Config) {
    return !has(config, 'follow') && hasPostProcess(config);
}

export function hasExtractions(config: Config): boolean {
    return has(config, 'source') || has(config, 'exp');
}

function hasPrimaryExtractions(config: Config) {
    return hasExtractions(config) && !isPostProcessType(config, 'extraction') && !hasFollow(config);
}

function hasOutputRestrictions(config: Config) {
    return config.output === false && config.validation == null;
}

function hasMatchRequirements(config: Config) {
    return has(config, 'other_match_required');
}

function createResults(list: OperationConfig[]): ValidationResults {
    const results: ValidationResults = {
        selectors: [],
        extractions: {},
        postProcessing: {},
        output: {
            restrictOutput: {},
            matchRequirements: {},
        },
    };
    const { output } = results;
    let currentSelector: undefined | string;
    const duplicateListing: Record<string, boolean> = {};

    list.forEach((config) => {
        if (duplicateListing[config.__id]) {
            return;
        }
        duplicateListing[config.__id] = true;

        if (hasOutputRestrictions(config)) {
            const key = config.target || config.source;
            output.restrictOutput[key as string] = true;
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

        if (hasMatchRequirements(config)) {
            const key = config.target || config.source as string;
            output.matchRequirements[key] = config.selector ?? config.__pipeline as string;
        }
    });

    return results;
}
