import ObserverCore, { ObserverCoreConstructor } from './core/observer-core';

/**
 * An Observer factory class for operations
 */
export default abstract class Observer extends ObserverCore {
}

export type ObserverConstructor = ObserverCoreConstructor;
