
import _ from 'lodash';
import graphlib from 'graphlib';
import { Logger } from '@terascope/utils';
import {
    OperationConfig,
    ValidationResults,
    NormalizedFields,
    ConfigProcessingDict,
    StateDict
} from '../interfaces';

const  { Graph, alg: { topsort, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[], logger: Logger) {
    const graph = new Graph();
    const tagMapping: StateDict = {};
    const graphEdges: StateDict = {};
    const oldCompatability: StateDict = {};

    function normalizeConfig(configList: OperationConfig[]) {
        configList.forEach((config) => {
            if (hasPostProcess(config)) {
                if (config.source_field) {
                    if (!config.target_field) config.target_field = config.source_field;
                } else {
                    const { soureField, targetField } = findFields(config, configList);
                    if (soureField.length === 1)  {
                        const source = soureField[0];
                        config.source_field = source;
                        config.target_field = targetField || source;
                    } else {
                        config.source_fields = soureField;
                        if (!targetField) throw new Error(`a target_field must be specified on a configuration with multiple source inputs. config: ${JSON.stringify(config)}`);
                        config.target_field = targetField;
                    }
                }
            }
        });
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
       // TODO: change name
        const configId = config.__id;

        if (isPrimaryConfig(config)) {
            const selectorNode = `selector:${config.selector}`;

            if (!graph.hasNode(selectorNode)) {
                graph.setNode(selectorNode, config);
            }

            if (hasPrimaryExtractions(config)) {
                graph.setNode(configId, config);
                graph.setEdge(selectorNode, configId);

                if (config.tags) {
                    config.tags.forEach((tag) => {
                        if (!tagMapping[tag]) {
                            tagMapping[tag] = [];
                        }
                        tagMapping[tag].push(configId);
                    });
                }
            }
        }

        if (isBackwordCompatiblePostProcessConfig(config)) {
            const selectorNode = `selector:${config.__pipeline}`;
            if (!oldCompatability[selectorNode]) {
                oldCompatability[selectorNode] = [];
            }
            oldCompatability[selectorNode].push(configId);
            // setting edges and tag mapping is done in a later step
            graph.setNode(configId, config);

        } else if (hasPostProcess(config)) {
            if (config.tags) {
                config.tags.forEach((tag) => {
                    if (!tagMapping[tag]) {
                        tagMapping[tag] = [];
                    }
                    tagMapping[tag].push(configId);
                });
            }

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

    _.forOwn(oldCompatability, (postProcessConfigIds, selectorNodeName) => {
        const extractionNodeIds = findNodeChildren(graph, selectorNodeName);
        if (extractionNodeIds === null) {
            throw new Error(`there must be extractions set for ${JSON.stringify(graph.node(selectorNodeName))} if using a post_process op without tag/follow syntax`);
        }

        postProcessConfigIds.forEach((postProcessConfigId) => {
            // we create edge for all extractions to post_process in old post_process configs
            extractionNodeIds.forEach((extractionId) => {
                graph.setEdge(extractionId, postProcessConfigId);
                // this is a non follow post proces config, we want to keep everything in the same pipline if possible for field validation
                if (!tagMapping[postProcessConfigId]) {
                    tagMapping[postProcessConfigId] = [];
                }
                tagMapping[postProcessConfigId].push(extractionId);
            });
        });
    });

    _.forOwn(graphEdges, (ids, key) => {
        // @ts-ignore
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
    normalizeConfig(configListOrder);
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
    return hasSelector(config) && !hasFollow(config) && !isPostProcessType(config, 'selector');
}

function findNodeChildren(graph: graphlib.Graph, node: string):string[]|null {
    const edges = graph.outEdges(node);
    if (edges) return edges.map(obj => obj.w);
    return null;
}

function isPostProcessType(config:OperationConfig, type: string) {
    return config.post_process === type;
}

function hasPipline(config:OperationConfig) {
    return _.has(config, '__pipeline');
}

function isBackwordCompatiblePostProcessConfig(config: OperationConfig) {
    return hasPipline(config) && hasPostProcess(config) && !hasFollow(config);
}

function hasSelector(config: OperationConfig) {
    return _.has(config, 'selector');
}

function hasFollow(config: OperationConfig) {
    return _.has(config, 'follow');
}
// @ts-ignore
function selectorPostProces(config: OperationConfig) {
    return hasSelector(config) && _.get(config, 'post_process') === 'selector';
}

function hasPostProcess(config: OperationConfig): boolean {
    return (_.has(config, 'post_process') || _.has(config, 'validation'));
}

export function isOldCompatabilityPostProcessConfig(config: OperationConfig): boolean {
    return (!hasFollow(config) && hasPostProcess(config) && hasSelector(config) && hasExtractions(config));
}

export function isSimplePostProcessConfig(config: OperationConfig) {
    return (!_.has(config, 'follow') && hasPostProcess(config));
}

export function hasExtractions(config: OperationConfig) {
    return _.has(config, 'source_field');
}

function hasPrimaryExtractions(config: OperationConfig) {
    return hasExtractions && !isPostProcessType(config, 'extraction');
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
            // TODO: fix the typing
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
