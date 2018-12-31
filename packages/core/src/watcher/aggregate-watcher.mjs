import chokidar from 'chokidar';

/**
 *
 */
export default class AggregateWatcher {
    defaultOptions = {
        timeout: 100,
        autostart: true,
        onReady: [],
        callbackParams: null,
    };

    /**
     * @param {string|Array} paths
     * @param {function|Array} callbacks
     * @param {Object} options
     */
    constructor(paths, callbacks, options = {}) {
        this.paths = paths;
        this.callbacks = [];

        if (callbacks) {
            for (const callback of (Array.isArray(callbacks) ? callbacks : [callbacks])) {
                if (typeof callback === 'function') {
                    this.addCallback(callback);
                }
                else if (typeof callback === 'object' && typeof callback.callback === 'function') {
                    this.addCallback(callback.callback, callback.callbackParams);
                }
            }
        }

        this.options = Object.assign({}, this.defaultOptions);
        this.chokidarOptions = {};
        this.setOptions(options);

        this.isReady = false;
        // eslint-disable-next-line no-nested-ternary
        this.onReadyCallbacks = this.options.onReady
            ? (Array.isArray(this.options.onReady) ? this.options.onReady : [this.options.onReady])
            : [];

        this.events = [];
        this.timeoutId = null;
        this.executingCallbacks = false;

        if (this.options.autostart) {
            this.start();
        }
    }

    /**
     *
     */
    start() {
        if (this.watcher) {
            return;
        }

        this.watcher = chokidar.watch(this.paths, this.chokidarOptions);

        this.watcher.on('ready', () => {
            this.watcher.on('all', (e, p) => {
                this.events.push({
                    event: e,
                    path: p,
                });

                if (!this.timeoutId && !this.executingCallbacks) {
                    this.timeoutId = setTimeout(this.runCallbacks.bind(this), this.options.timeout);
                }
            });

            this.isReady = true;

            (async () => {
                for (let i = 0; i < this.onReadyCallbacks.length; i++) {
                    // eslint-disable-next-line no-await-in-loop
                    await this.onReadyCallbacks[i]();
                }
            })();
        });
    }

    /**
     * @returns {Promise.<void>}
     */
    async runCallbacks() {
        this.timeoutId = null;
        const events = [...this.events];
        this.events = [];

        this.executingCallbacks = true;

        for (let i = 0; i < this.callbacks.length; i++) {
            const {callback, callbackParams} = this.callbacks[i];
            // eslint-disable-next-line no-await-in-loop
            await callback(
                // every subscriber/callback gets own copy of events to avoid side effects
                [...events],
                Object.assign(
                    {},
                    this.options.callbackParams || {},
                    callbackParams || {},
                ),
            );
        }

        this.executingCallbacks = false;

        if (this.events.length > 0) {
            this.timeoutId = setTimeout(this.runCallbacks.bind(this), 0);
        }
    }

    /**
     * @param {function} callback
     * @param {*} callbackParams
     */
    addCallback(callback, callbackParams = null) {
        this.callbacks.push({callback, callbackParams});
    }

    /**
     * @param {function} callback
     */
    onReady(callback) {
        if (!this.isReady) {
            this.onReadyCallbacks.push(callback);
        }
        else {
            callback();
        }
    }

    /**
     * @param {Object} options
     */
    setOptions(options) {
        for (const option of Object.keys(options)) {
            if (Object.prototype.hasOwnProperty.call(this.defaultOptions, option)) {
                this.options[option] = options[option];
            }
            else {
                this.chokidarOptions[option] = options[option];
            }
        }
    }
}
