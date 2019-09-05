
import { DataEntity } from '@terascope/utils';
import { hasKeys } from './utils';
import {
    WatcherConfig,
    ExtractionProcessingDict,
    ExtractionPipline
} from '../interfaces';
import PhaseBase from './base';
import { OperationsManager, Extraction } from '../operations';

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
            // @ts-ignore
            runExtractions(this.phase, doc, results);
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
