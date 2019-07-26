
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import  { hasKeys } from './utils';
import { WatcherConfig, ExtractionProcessingDict, OperationsPipline, Operation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class ExtractionPhase extends PhaseBase {

    constructor(opConfig: WatcherConfig, configList:ExtractionProcessingDict, opsManager: OperationsManager) {
        super(opConfig);
        this.opConfig = opConfig;
        const Extraction = opsManager.getTransform('extraction');

        _.forOwn(configList, (operationList, key) => {
            this.phase[key] = [new Extraction(operationList)];
        });

        this.hasProcessing = hasKeys(this.phase);
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (let i = 0; i < dataArray.length; i += 1) {
            const results = createTargetResults(dataArray[i]);
            runSelectors(this.phase, dataArray[i], results);
            if (results.metadata.hasExtractions) {
                resultsList.push(results.entity);
            }
        }

        return resultsList;
    }
}

function createTargetResults(input: DataEntity) {
    const { entity, metadata } = DataEntity.makeRaw({}, input.getMetadata());
    return {
        metadata,
        entity,
    };
}

function runSelectors(phase: OperationsPipline, doc: DataEntity, results: { entity: DataEntity, metadata: any }) {
    for (let i = 0; i < results.metadata.selectors.length; i++) {
        runSelector(phase[results.metadata.selectors[i]], doc, results);
    }
    return results;
}

function runSelector(selectorPhase: Operation[], doc: DataEntity, results: { entity: DataEntity, metadata: any }) {
    for (let i = 0; i < selectorPhase.length; i++) {
        // @ts-ignore
        selectorPhase[i].extractRun(doc, results);
    }
}
