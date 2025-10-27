import { DataEntity } from '@terascope/core-utils';
import { hasKeys } from './utils.js';
import {
    WatcherConfig, ExtractionProcessingDict, ExtractionPipline
} from '../interfaces.js';
import PhaseBase from './base.js';
import { OperationsManager, Extraction } from '../operations/index.js';

export default class ExtractionPhase extends PhaseBase {
    constructor(
        opConfig: WatcherConfig,
        configList: ExtractionProcessingDict,
        opsManager: OperationsManager
    ) {
        super(opConfig);
        this.opConfig = opConfig;
        const ExtractionOp = opsManager.getTransform('extraction');

        for (const [key, operationList] of Object.entries(configList)) {
            this.phase[key] = [new ExtractionOp(operationList)];
        }

        this.hasProcessing = hasKeys(this.phase);
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        for (const doc of dataArray) {
            const results = createTargetResults(doc);

            runExtractions(this.phase as ExtractionPipline, doc, results);
            if (results.metadata.hasExtractions) {
                resultsList.push(results.entity);
            }
        }

        return resultsList;
    }
}

function createTargetResults(input: DataEntity): { entity: DataEntity; metadata: any } {
    const entity = DataEntity.fork(input, false);
    return {
        metadata: entity.getMetadata(),
        entity,
    };
}

function runExtractions(
    phase: ExtractionPipline,
    doc: DataEntity,
    results: { entity: DataEntity; metadata: any }
): { entity: DataEntity; metadata: any } {
    for (const selector of results.metadata.selectors) {
        runSelectorExtraction(phase[selector], doc, results);
    }
    return results;
}

function runSelectorExtraction(
    extractionPhase: Extraction[],
    doc: DataEntity,
    results: { entity: DataEntity; metadata: any }
): void {
    for (const extractor of extractionPhase) {
        extractor.extractionPhaseRun(doc, results);
    }
}
