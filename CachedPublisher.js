"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CachedPublisher {
    constructor() {
        this.listeners = new Map();
        this.cachedEvents = new Map();
    }
    subscribe(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
        if (this.cachedEvents.has(eventName)) {
            this.cachedEvents.get(eventName).forEach((args) => {
                callback(...args);
            });
            this.cachedEvents.delete(eventName);
        }
    }
    emitEvent(eventName, ...args) {
        if (!this.listeners.has(eventName)) {
            if (!this.cachedEvents.has(eventName)) {
                this.cachedEvents.set(eventName, []);
            }
            this.cachedEvents.get(eventName).push(args);
        }
        else {
            this.listeners.get(eventName).forEach((sub) => {
                sub(...args);
            });
        }
    }
}
exports.CachedPublisher = CachedPublisher;
