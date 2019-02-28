import fastglob from 'fast-glob';
import AggregateWatcher from '@deflock/aggregate-watcher';
import {ParallelProcessor, SeriesProcessor} from "./composition-processors";

/**
 *
 */
export default class AbstractBuilder {
    /**
     * @param {string} env
     * @param {Object} options
     */
    constructor(env, options = {}) {
        this.env = env;

        const childDefaultOptions = this.getChildOptions();

        const childOptions = {};
        const passedOptions = {};

        ['glob', 'watch'].forEach(opt => {
            childOptions[opt] = childDefaultOptions[opt] || {};
            passedOptions[opt] = options[opt] || {};
            delete childDefaultOptions[opt];
            delete options[opt];
        });

        const newOptions = Object.assign({
            cwd: process.cwd(),
            patterns: '**/*',
            ignore: [],
            compositionProcessorMode: 'series',
        }, childDefaultOptions, options);

        const defaultOptions = {
            glob: {
                cwd: newOptions.cwd,
                patterns: newOptions.patterns,
                ignore: newOptions.ignore,
            },
            watch: {
                cwd: newOptions.cwd,
                patterns: newOptions.patterns,
                ignored: newOptions.ignore,
                autostart: false,
                timeout: 100,
            },
        };

        ['glob', 'watch'].forEach(opt => {
            newOptions[opt] = Object.assign(defaultOptions[opt], childOptions[opt], passedOptions[opt]);
        });

        this.options = newOptions;

        this.compositionProcessor = this.options.compositionProcessorMode === 'parallel'
            ? new ParallelProcessor()
            : new SeriesProcessor();

        this.addDefaultProcessors();
    }

    /**
     * @returns {Object}
     */
    getChildOptions() {
        return {
            glob: {},
            watch: {},
        };
    }

    /**
     * @returns {Promise}
     */
    async build() {
        await this.beforeBuild();
        await this.buildGlob({
            isWatch: false,
        });
        await this.afterBuild();
    }

    /**
     * @returns {Promise<void>}
     */
    async beforeBuild() {
    }

    /**
     * @returns {Promise<void>}
     */
    async afterBuild() {
    }

    /**
     * @returns {Promise<void>}
     */
    async buildGlob(params) {
        if (!this.options.glob.patterns) {
            throw new Error('Glob patterns must be specified');
        }

        const paths = await fastglob(this.options.glob.patterns, this.options.glob);

        const files = [];

        paths.forEach(path => {
            files.push({
                path,
                state: 'init',
            });
        });

        await this.compositionProcessor.process(files, {
            basedir: this.options.glob.cwd,
            isWatch: params.isWatch,
        });
    }

    /**
     * @param {Object} watchOptions
     * @returns {Promise}
     */
    async watch(watchOptions = {}) {
        await this.beforeWatchStart(watchOptions);

        await this.buildGlob({
            isWatch: true,
        });

        this.addAppWatcherProcessCallback();
        await this.startAppWatcher();

        await this.afterWatchStart(watchOptions);
    }

    /**
     * @param {Object} watchOptions
     * @returns {Promise<void>}
     */
    async beforeWatchStart(watchOptions) {
    }

    /**
     * @param {Object} watchOptions
     * @returns {Promise<void>}
     */
    async afterWatchStart(watchOptions) {
    }

    /**
     *
     */
    addAppWatcherProcessCallback() {
        this.getAppWatcher().addCallback(this.processWatcherEvents.bind(this));
    }

    /**
     * @param {Array} allEvents
     * @param {Object} cbParams
     */
    async processWatcherEvents(allEvents, cbParams) {
        await this.beforeWatchProcess();

        // const events = this.filterWatcherEvents(allEvents);
        const events = allEvents;
        const files = [];

        if (events.length) {
            for (const ev of events) {
                files.push({
                    path: ev.path,
                    state: ev.event,
                });
            }

            await this.compositionProcessor.process(files, {
                basedir: this.options.watch.cwd,
                isWatch: true,
            });
        }

        await this.afterWatchProcess();
    }

    /**
     * @returns {Promise<void>}
     */
    async beforeWatchProcess() {
    }

    /**
     * @returns {Promise<void>}
     */
    async afterWatchProcess() {
    }

    /**
     * @returns {Promise}
     */
    async startAppWatcher() {
        return new Promise(resolve => {
            const watcher = this.getAppWatcher();
            watcher.onReady(resolve);
            watcher.start();
        });
    }

    /**
     * @returns {AggregateWatcher}
     */
    createAppWatcher() {
        return new AggregateWatcher(this.options.watch.patterns, [], this.options.watch);
    }

    /**
     * @returns {AggregateWatcher}
     */
    getAppWatcher() {
        if (!this.appWatcher) {
            this.appWatcher = this.createAppWatcher();
        }
        return this.appWatcher;
    }

    /**
     * @param {Object|function|Array} processors
     * @returns {AbstractBuilder}
     */
    addProcessor(...processors) {
        for (const procs of processors) {
            for (const proc of Array.isArray(procs) ? procs : [procs]) {
                this.compositionProcessor.add(proc);
            }
        }
        return this;
    }

    /**
     * @returns {AbstractBuilder}
     */
    clearProcessors() {
        this.compositionProcessor.clear();
        return this;
    }

    /**
     *
     */
    addDefaultProcessors() {
    }
}
