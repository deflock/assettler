import nodepath from 'path';
import {getFiles} from '@assettler/utils/fs';
import {pathMatchesExtension} from '@assettler/utils/path';
import AggregateWatcher from './watcher/aggregate-watcher';
import {latestFilesEvents} from './watcher/utils';

/**
 *
 */
export default class Processor {
    /**
     * @param {string|null} basedir
     * @param {Object} options
     */
    constructor(basedir, options = {}) {
        this.basedir = basedir;
        this.options = options;
    }

    /**
     * @param {string} dir
     * @returns {Promise}
     */
    async processDir(dir) {
        const files = getFiles('**/*', dir);

        for (const relativePath of files) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await this.processFile(relativePath, dir);
            }
            catch (e) {
                this.handleProcessFileException(e);
            }
        }
    }

    /**
     * @param {Error} e
     */
    handleProcessFileException(e) {
        throw e;
    }

    /**
     * @param {string} relativePath
     * @param {string} basedir
     * @returns {Promise}
     */
    async processFile(relativePath, basedir = this.basedir) {
        throw new Error('Method "processFile()" is not implemented');
    }

    /**
     * @param {string} relativePath
     * @param {string|null} basedir
     * @returns {boolean}
     */
    isPathProcessable(relativePath, basedir = null) {
        return this.isProcessablePathExtensions(relativePath, basedir)
            && this.isProcessablePathExclude(relativePath, basedir);
    }

    /**
     * @param {string} relativePath
     * @param {string|null} basedir
     * @return {boolean}
     */
    isProcessablePathExtensions(relativePath, basedir = null) {
        if (!this.options.extensions
            || (Array.isArray(this.options.extensions) && !this.options.extensions.length)
        ) {
            return true;
        }
        return pathMatchesExtension(relativePath, this.options.extensions);
    }

    /**
     * @param {string} relativePath
     * @param {string|null} basedir
     * @return {boolean}
     */
    isProcessablePathExclude(relativePath, basedir = null) {
        if (!this.options.exclude) {
            return true;
        }

        if (basedir == null) {
            // eslint-disable-next-line no-param-reassign
            basedir = this.basedir;
        }

        for (const exclude of this.options.exclude) {
            if (exclude instanceof RegExp) {
                if (exclude.test(relativePath)) {
                    return false;
                }
            }
            else {
                if (nodepath.resolve(basedir, relativePath).indexOf(nodepath.resolve(basedir, exclude)) === 0) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @returns {Promise}
     */
    async build() {
        await this.processDir(this.basedir);
    }

    /**
     * @param {Object} watchOptions
     * @return {Promise<any>}
     */
    async watch(watchOptions = {}) {
        await this.processDir(this.basedir);

        this.watcher = this.options.watcher ? this.options.watcher : this.createWatcher();
        this.addWatcherDefaultProcessCallback(this.watcher, watchOptions);
    }

    /**
     * @return {AggregateWatcher}
     */
    createWatcher() {
        return new AggregateWatcher('**/*', [], {
            cwd: this.basedir,
        });
    }

    /**
     * @param {Object} watcher
     * @param {Object} options
     */
    addWatcherDefaultProcessCallback(watcher, options = {}) {
        watcher.addCallback(
            this.processWatcherEvents.bind(this),
            Object.assign(
                options.beforeProcess ? {beforeProcess: options.beforeProcess} : {},
                options.afterProcess ? {afterProcess: options.afterProcess} : {},
            ),
        );
    }

    /**
     * @param {Array} allEvents
     * @param {Object} params
     */
    async processWatcherEvents(allEvents, params) {
        const events = this.filterWatcherEvents(allEvents);

        if (events.length) {
            await this.beforeProcessWatcherEvents(events, allEvents, params);

            for (const ev of events) {
                if (ev.event === 'add') {
                    // eslint-disable-next-line no-await-in-loop
                    await this.onWatcherFileAdd(ev.path);
                }
                if (ev.event === 'change') {
                    // eslint-disable-next-line no-await-in-loop
                    await this.onWatcherFileChange(ev.path);
                }
                else if (ev.event === 'unlink') {
                    // eslint-disable-next-line no-await-in-loop
                    await this.onWatcherFileRemove(ev.path);
                }
            }

            await this.afterProcessWatcherEvents(events, allEvents, params);
        }
    }

    /**
     * Usually this method should not be overriden. Instead override `isPathProcessable()`.
     * Method `isPathProcessable()` is used not only on watch but in build mode as well.
     *
     * @param {Array} events
     * @return {Array}
     */
    filterWatcherEvents(events) {
        return latestFilesEvents([...events]).filter(ev => this.isPathProcessable(ev.path));
    }

    /**
     * @param {Array} events
     * @param {Array} allEvents
     * @param {Object} params
     * @return {Promise<void>}
     */
    async beforeProcessWatcherEvents(events, allEvents, params) {
        if (params.beforeProcess) {
            for (const cb of Array.isArray(params.beforeProcess) ? params.beforeProcess : [params.beforeProcess]) {
                // eslint-disable-next-line no-await-in-loop
                await cb(events, allEvents);
            }
        }
    }

    /**
     * @param {Array} events
     * @param {Array} allEvents
     * @param {Object} params
     * @return {Promise<void>}
     */
    async afterProcessWatcherEvents(events, allEvents, params) {
        if (params.afterProcess) {
            for (const cb of Array.isArray(params.afterProcess) ? params.afterProcess : [params.afterProcess]) {
                // eslint-disable-next-line no-await-in-loop
                await cb(events, allEvents);
            }
        }
    }

    /**
     * @param {string} relativePath
     * @return {Promise<void>}
     */
    async onWatcherFileAdd(relativePath) {
    }

    /**
     * @param {string} relativePath
     * @return {Promise<void>}
     */
    async onWatcherFileChange(relativePath) {
    }

    /**
     * @param {string} relativePath
     * @return {Promise<void>}
     */
    async onWatcherFileRemove(relativePath) {
    }

    /**
     * @param {Object} args
     */
    mergeWatchOptions(...args) {
        const options = {};
        let beforeProcess = [];
        let afterProcess = [];

        for (const opts of args) {
            if (!opts) {
                continue;
            }
            beforeProcess = this.mergeWatcherProcessCallbacks(beforeProcess, opts.beforeProcess);
            afterProcess = this.mergeWatcherProcessCallbacks(afterProcess, opts.afterProcess);
            Object.assign(options, opts);
        }

        options.beforeProcess = beforeProcess;
        options.afterProcess = afterProcess;

        return options;
    }

    /**
     * @param {Array} args
     * @return {Array}
     */
    mergeWatcherProcessCallbacks(...args) {
        let callbacks = [];

        for (const arg of args) {
            if (!arg) {
                continue;
            }
            callbacks = callbacks.concat(Array.isArray(arg) ? arg : [arg]);
        }

        return callbacks;
    }

    /**
     * @return {Object}
     */
    getMaps() {
        return {};
    }
}
