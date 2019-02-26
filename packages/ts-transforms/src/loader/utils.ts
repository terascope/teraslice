
import _ from 'lodash';
import graphlib from 'graphlib';
import {
    OperationConfig,
    ValidationResults,
    NormalizedFields
} from '../interfaces';
// @ts-ignore
const  { Graph, alg: { topsort, isAcyclic, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[]) {
    const graph = new Graph();
    const tagMapping = {};
    const graphEdges = {};

    function normalizeConfig(id: string): OperationConfig {
        const config: OperationConfig = graph.node(id);
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

    function findFields(config: OperationConfig): NormalizedFields {
        let searchingConfig = config;
        let soureField = null;
        let targetField = config.target_field;

        while (soureField === null) {
            const nodeId = tagMapping[searchingConfig.follow as string];
            const resultsConfig: OperationConfig|OperationConfig[] = graph.node(nodeId);
            let sourceConfig;
            if (Array.isArray(resultsConfig)) {
                sourceConfig = resultsConfig.find((obj) => obj.tag === searchingConfig.follow);
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

    function createResults(list: string[]): ValidationResults {
        const results = { selectors: [], extractions: {}, postProcessing: {} };
        let currentSelector: null|string = null;

        list.forEach((label) => {
            if (isSelectorNode(label)) {
                const selector: string = graph.node(label);
                currentSelector = selector;
                // @ts-ignore
                results.selectors.push(selector);
            } else if (isExtractionNode(label)) {
                results.extractions[removeAnnotation(label)] = graph.node(label);
            } else {
                if (!results.postProcessing[currentSelector as string]) {
                    results.postProcessing[currentSelector as string] = [graph.node(label)];
                } else {
                    results.postProcessing[currentSelector as string].push(graph.node(label));
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
                graph.setNode(selectorNode, config.selector);
            }
            if (config.source_field) {
                if (!graph.hasNode(extractionNode)) {
                    graph.setNode(extractionNode, [config]);
                    graph.setEdge(selectorNode, extractionNode);
                } else {
                    const extractionList = graph.node(extractionNode);
                    extractionList.push(config);
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
    sortList.forEach(normalizeConfig);
    return createResults(sortList);
}

function isSelectorNode(str: string) {
    return str.includes('selector:');
}

function isExtractionNode(str: string) {
    return str.includes('extractions:');
}

function removeAnnotation(str: string) {
    return str.replace('extractions:', '');
}
// TODO: review what needs to be exported
export function isPrimaryConfig(config: OperationConfig) {
    if (_.has(config, 'selector') && !config.follow && !config.other_match_required) return true;
    return false;
}

export function isPostProcessConfig(config: OperationConfig): boolean {
    if (_.has(config, 'post_process') || _.has(config, 'validation')) return true;
    return false;
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
