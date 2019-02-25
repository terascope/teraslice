
import _ from 'lodash';
import graphlib from 'graphlib';
// @ts-ignore
import { OperationConfig, ValidationResults, NormalizedConfig, ConfigResults } from '../interfaces';
// @ts-ignore
const  { Graph, alg: { topsort, isAcyclic, findCycles } } = graphlib;

export function parseConfig(configList: OperationConfig[]) {
    const graph = new Graph();
    const tagMapping = {};

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
        if (isSelectorPhaseConfig(config)) {
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
                tagMapping[config.tag] = config.follow;
            }
            // TODO: need to normalize
            const id = config.follow as string;
            // TODO: throw error if it already exists
            graph.setNode(id, config);
            graph.setEdge(tagMapping[id], id);
        } else {
            console.log('i should not be in the final else', config)
        }
    });

    try {

        // console.log('findCycles', findCycles(graph))

        const sortList = topsort(graph);

        const finalResults = createResults(sortList);

        return finalResults;

    } catch (err) {
        console.log('what error', err)

    }
    return false;
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

export function isSelectorPhaseConfig(config: OperationConfig) {
    if (_.has(config, 'selector') && !config.follow && !config.other_match_required) return true;
    return false;
}

export function isPostProcessConfig(config: OperationConfig): boolean {
    if (_.has(config, 'post_process') || _.has(config, 'validation')) return true;
    return false;
}
// @ts-ignore
// function normalizeConfig(config: OperationConfig, type: string, configList:OperationConfig[]): NormalizedConfig {
//     const data = { registrationSelector: config.selector, targetConfig: null };

//     function findConfiguration(myConfig: OperationConfig, container: ConfigResults): ConfigResults {
//         if (myConfig.follow) {
//             const id = myConfig.follow;
//             const referenceConfig = configList.find(obj => obj.tag === id);
//             if (!referenceConfig) throw new Error(`could not find configuration tag identifier for follow ${id}`);
//             if (!container.targetConfig && referenceConfig.target_field) container.targetConfig = referenceConfig;
//             // recurse
//             if (referenceConfig.follow) {
//                 return findConfiguration(referenceConfig, container);
//             }
//             if (referenceConfig.selector) container.registrationSelector = referenceConfig.selector;
//         } else {
//             if (!container.targetConfig) container.targetConfig = myConfig;
//             if (!container.registrationSelector && myConfig.selector) container.registrationSelector = myConfig.selector;
//         }
//         return container;
//     }

//     const { registrationSelector, targetConfig } = findConfiguration(config, data);
//     if (!config.other_match_required && !registrationSelector || !targetConfig) throw new Error('could not find orignal selector and target configuration');
//     // a validation/post-op source is the target_field of the previous op
//     const formattedTargetConfig = {};
//     // TODO: look at this deeper
//     if (!(config.follow && config.source_field) && targetConfig.target_field && (type === 'validation' || type === 'post_process')) {
//         formattedTargetConfig['source_field'] = targetConfig.target_field;
//     }
//     const finalConfig = _.assign({}, config, formattedTargetConfig);

//     return { configuration: finalConfig, registrationSelector: registrationSelector as string };
// }
// @ts-ignore
function isPostProcessRootConfig(config: OperationConfig) {
    if (!_.has(config, 'follow') && _.has(config, 'selector')) return true;
    return false;
}

export function isSimplePostProcessConfig(config: OperationConfig) {
    if (!_.has(config, 'follow') && isPostProcessConfig(config)) return true;
    return false;
}
