import { SlicerResult, OpConfig } from '../interfaces/index.js';
import SlicerCore from './core/slicer-core.js';

/**
 * The simpliest form a "Slicer"
 *
 * See [[SlicerCore]]
 */

export default abstract class Slicer<T = OpConfig> extends SlicerCore<T> {
    /**
     * @private
     */
    protected order = 0;

    isFinished = false;

    /**
     * A method called by {@link Slicer#handle}
     * @returns a Slice, or SliceRequest
     */
    abstract slice(): Promise<SlicerResult>;

    slicers(): number {
        return 1;
    }

    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        const result = await this.slice();
        if (result == null && this.canComplete()) {
            this.isFinished = true;
            this.logger.info('slicer has completed its range');
            this.events.emit('slicer:done', 0);
            return true;
        }

        if (result == null) return false;

        if (Array.isArray(result)) {
            this.events.emit('slicer:subslice');
            result.forEach((item) => {
                this.order += 1;
                this.createSlice(item, this.order);
            });
        } else {
            this.order += 1;
            this.createSlice(result, this.order);
        }

        return false;
    }
}
