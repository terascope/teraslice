import APICore from './core/api-core.js';
import { APIConfig } from '../interfaces/index.js';

/**
 * An Observer factory class for operations
 */
export default abstract class Observer<T = APIConfig> extends APICore<T> {
}
