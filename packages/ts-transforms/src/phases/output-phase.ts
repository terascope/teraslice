import { unset, has } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { hasKeys } from './utils.js';
import { WatcherConfig, OutputValidation } from '../interfaces.js';
import PhaseBase from './base.js';
import { OperationsManager } from '../operations/index.js';

type Filter = (key: string) => boolean;

export default class OutputPhase extends PhaseBase {
    private restrictOutput: Record<string, any>;
    private matchRequirements: Record<string, any>;
    private hasRestrictedOutput: boolean;
    private hasRequirements: boolean;

    constructor(
        opConfig: WatcherConfig,
        outputConfig: OutputValidation,
        _opsManager: OperationsManager
    ) {
        super(opConfig);
        this.restrictOutput = outputConfig.restrictOutput;
        this.matchRequirements = outputConfig.matchRequirements;
        this.hasRequirements = Object.keys(this.matchRequirements).length > 0;
        this.hasRestrictedOutput = Object.keys(this.restrictOutput).length > 0;
    }

    requiredExtractions(data: DataEntity[]): DataEntity[] {
        const finalResults: DataEntity[] = [];
        const isKeyMatchRequired = isKeyMatchRequiredFn(this.matchRequirements);

        for (const doc of data) {
            const {
                otherExtractionsFound,
                requireExtractionsFound
            } = checkDoc(doc, isKeyMatchRequired);

            if (!requireExtractionsFound || (requireExtractionsFound && otherExtractionsFound)) {
                finalResults.push(doc);
            }
        }

        return finalResults;
    }

    public run(data: DataEntity[]): DataEntity[] {
        let results = data;

        if (this.hasRestrictedOutput) {
            results = restrictFields(results, this.restrictOutput);
        }

        if (this.hasRequirements) {
            results = this.requiredExtractions(results);
        }

        return results;
    }
}

function removeKeys(doc: DataEntity, dict: Record<string, any>) {
    for (const key in dict) {
        if (has(doc, key)) unset(doc, key);
    }
}

function restrictFields(data: DataEntity[], restrictOutput: Record<string, any>) {
    const restrictedData: DataEntity[] = [];
    for (const doc of data) {
        removeKeys(doc, restrictOutput);
        if (hasKeys(doc)) restrictedData.push(doc);
    }
    return restrictedData;
}

function isKeyMatchRequiredFn(matchRequirements: Record<string, any>) {
    return function isKeyMatchRequired(key: string) {
        return matchRequirements[key] !== undefined;
    };
}

function checkDoc(doc: DataEntity, fn: Filter) {
    let otherExtractionsFound = false;
    let requireExtractionsFound = false;
    for (const key in doc) {
        if (fn(key)) {
            requireExtractionsFound = true;
        } else {
            otherExtractionsFound = true;
        }
    }
    return { otherExtractionsFound, requireExtractionsFound };
}
