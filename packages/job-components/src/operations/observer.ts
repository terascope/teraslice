import APICore from './core/api-core';
import { APIConfig } from '../interfaces';

/**
 * An Observer factory class for operations
 */
export default abstract class Observer<T = APIConfig> extends APICore<T> {
}
