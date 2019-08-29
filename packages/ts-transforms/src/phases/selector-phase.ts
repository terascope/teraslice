/* eslint-disable @typescript-eslint/prefer-for-of */

import { DataEntity } from '@terascope/utils';
import { WatcherConfig, Operation, SelectorConfig } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class SelectionPhase extends PhaseBase {
    readonly selectionPhase: Operation[];

    constructor(
        opConfig: WatcherConfig,
        selectorList: SelectorConfig[],
        opsManager: OperationsManager
    ) {
        super(opConfig);
        this.opConfig = opConfig;

        const Selector = opsManager.getTransform('selector');
        this.selectionPhase = selectorList
            .map((config) => new Selector(config, this.opConfig.types));
    }

    public run(data: DataEntity[]): DataEntity[] {
        if (this.selectionPhase.length > 0) {
            const results = [];
            for (let i = 0; i < data.length; i += 1) {
                const record = data[i];
                record.setMetadata('selectors', null);
                for (let j = 0; j < this.selectionPhase.length; j += 1) {
                    this.selectionPhase[j].run(record);
                }
                const recordMeta = record.getMetadata('selectors');
                if (recordMeta) {
                    results.push(record);
                }
            }
            return results;
        }

        return [];
    }
}
