import fastglob from 'fast-glob';
import AggregateWatcher from '@deflock/aggregate-watcher';
import {ParallelProcessor, SeriesProcessor} from './composition-processors';

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

        const finalOptions = Object.assign({
            cwd: process.cwd(),
            patterns: '**/*',
            ignore: [],
            compositionProcessorMode: 'series',
            verbose: false,
        }, childDefaultOptions, options);

        const defaultOptions = {
            glob: {
                cwd: finalOptions.cwd,
                patterns: finalOptions.patterns,
                ignore: finalOptions.ignore,
            },
            watch: {
                cwd: finalOptions.cwd,
                patterns: finalOptions.patterns,
                ignored: finalOptions.ignore,
                autostart: false,
                timeout: 100,
            },
        };

        ['glob', 'watch'].forEach(opt => {
            finalOptions[opt] = Object.assign(defaultOptions[opt], childOptions[opt], passedOptions[opt]);
        });

        this.options = finalOptions;

        // eslint-disable-next-line no-console
        this.log = this.options.verbose ? console.log.bind(console, '[Assettler]') : () => {};

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
        this.log('build beforeBuild start');
        await this.beforeBuild();
        this.log('build beforeBuild end');

        this.log('build buildGlob start');
        await this.buildGlob({
            isWatch: false,
        });
        this.log('build buildGlob end');

        this.log('build afterBuild start');
        await this.afterBuild();
        this.log('build afterBuild end');
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

        this.log('buildGlob fastglob start');
        const paths = await fastglob(this.options.glob.patterns, this.options.glob);
        this.log('buildGlob fastglob end');

        this.log('buildGlob fastglob found:', paths.length);

        const files = [];

        paths.forEach(path => {
            files.push({
                path,
                state: 'init',
            });
        });

        this.log('buildGlob compositionProcessor.process start');
        await this.compositionProcessor.process(files, {
            basedir: this.options.glob.cwd,
            isWatch: params.isWatch,
            log: this.log,
        });
        this.log('buildGlob compositionProcessor.process end');
    }

    /**
     * @param {Object} watchOptions
     * @returns {Promise}
     */
    async watch(watchOptions = {}) {
        this.log('watch beforeWatchStart start');
        await this.beforeWatchStart(watchOptions);
        this.log('watch beforeWatchStart end');

        this.log('watch buildGlob start');
        await this.buildGlob({
            isWatch: true,
        });
        this.log('watch buildGlob end');

        this.log('watch startWatcher start');
        this.getWatcher().addCallback(this.processWatcherEvents.bind(this));
        await this.startWatcher();
        this.log('watch startWatcher end');

        this.log('watch afterWatchStart start');
        await this.afterWatchStart(watchOptions);
        this.log('watch afterWatchStart end');
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
     * @param {Array} allEvents
     * @param {Object} cbParams
     */
    async processWatcherEvents(allEvents, cbParams) {
        this.log('processWatcherEvents beforeWatchProcess start');
        await this.beforeWatchProcess(allEvents, cbParams);
        this.log('processWatcherEvents beforeWatchProcess end');

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

            this.log('processWatcherEvents events count:', files.length);

            this.log('processWatcherEvents compositionProcessor.process start');
            await this.compositionProcessor.process(files, {
                basedir: this.options.watch.cwd,
                isWatch: true,
                log: this.log,
            });
            this.log('processWatcherEvents compositionProcessor.process end');
        }

        this.log('processWatcherEvents afterWatchProcess start');
        await this.afterWatchProcess(allEvents, cbParams);
        this.log('processWatcherEvents afterWatchProcess end');
    }

    /**
     * @param {Array} events
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async beforeWatchProcess(events, params) {
    }

    /**
     * @param {Array} events
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async afterWatchProcess(events, params) {
    }

    /**
     * @returns {AggregateWatcher}
     */
    getWatcher() {
        if (!this.watcher) {
            this.watcher = this.createWatcher();
        }
        return this.watcher;
    }

    /**
     * @returns {AggregateWatcher}
     */
    createWatcher() {
        return new AggregateWatcher(this.options.watch.patterns, [], this.options.watch);
    }

    /**
     * @returns {Promise}
     */
    async startWatcher() {
        return new Promise(resolve => {
            const watcher = this.getWatcher();
            watcher.onReady(resolve);
            watcher.start();
        });
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
