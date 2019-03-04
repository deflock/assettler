import AbstractProcessor from './abstract-processor';

/**
 *
 */
class CompositionProcessor extends AbstractProcessor {
    /**
     * @param {Array} processors
     */
    constructor(...processors) {
        super();

        this.list = [];

        for (let i = 0; i < processors.length; i++) {
            this.list.push(processors[i]);
        }
    }

    /**
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async process(files, params) {
        // Return is very important here instead of await!
        // Looks like babel transpiles `await this ...` to `(await this) ...`
        return this instanceof ParallelProcessor
            ? this.doProcessParallel(this.getAsArray(), files, params)
            : this.doProcessSeries(this.getAsArray(), files, params);
    }

    /**
     * @param {Array} processors
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<void>}
     */
    doProcessSeries(processors, files, params) {
        let promise = Promise.resolve();

        for (const processor of processors) {
            if (processor instanceof SeriesProcessor) {
                promise = promise.then(() => this.doProcessSeries(processor.getAsArray(), files, params));
            } else if (processor instanceof ParallelProcessor) {
                promise = promise.then(() => this.doProcessParallel(processor.getAsArray(), files, params));
            } else {
                if (typeof processor === 'object' && processor.process) {
                    promise = promise.then(() => processor.process(files, params));
                } else if (typeof processor === 'function') {
                    promise = promise.then(() => processor(files, params));
                } else {
                    throw new Error('Processor must be a function or implement Processor');
                }
            }
        }

        return promise;
    }

    /**
     * @param {Array} processors
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<void>}
     */
    doProcessParallel(processors, files, params) {
        const promises = [];

        for (const processor of processors) {
            if (processor instanceof SeriesProcessor) {
                promises.push(this.doProcessSeries(processor.getAsArray(), files, params));
            } else if (processor instanceof ParallelProcessor) {
                promises.push(this.doProcessParallel(processor.getAsArray(), files, params));
            } else {
                if (typeof processor === 'object' && processor.process) {
                    promises.push(processor.process(files, params));
                } else if (typeof processor === 'function') {
                    promises.push(processor(files, params));
                } else {
                    throw new Error('Processor must be a function or implement Processor');
                }

            }
        }

        return Promise.all(promises);
    }

    /**
     * @param {Object|function} entry
     * @returns {CompositionProcessor}
     */
    add(entry) {
        this.list.push(entry);
        return this;
    }

    /**
     * @param {int} index
     * @returns {Object|function}
     */
    get(index) {
        if (!Object.prototype.hasOwnProperty.call(this.list, index)) {
            throw new Error(`Element "${index}" does not exist`);
        }
        return this.list[index];
    }

    /**
     * @returns {Array}
     */
    getAsArray() {
        return [...this.list];
    }

    /**
     *
     */
    clear() {
        this.list = [];
    }

    /**
     * @returns {Array}
     */
    getFlatProcessorList() {
        return this.doGetFlatProcessorList(...this.list);
    }

    /**
     * @param {Array} processors
     * @returns {Array}
     */
    doGetFlatProcessorList(...processors) {
        const result = [];

        for (const procs of processors) {
            for (const proc of Array.isArray(procs) ? procs : [procs]) {
                if (proc instanceof SeriesProcessor || proc instanceof ParallelProcessor) {
                    result.concat(this.doGetFlatProcessorList(...proc.getAsArray()));
                } else {
                    result.push(proc);
                }
            }
        }

        return result;
    }
}

/**
 *
 */
export class SeriesProcessor extends CompositionProcessor {
}

/**
 *
 */
export class ParallelProcessor extends CompositionProcessor {
}
