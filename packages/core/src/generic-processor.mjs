import nodefs from 'fs';
import nodepath from 'path';
import {trimCharsLeft} from '@deflock/string-trim';
import {pathMatchesExtension} from '@deflock/path';
import {mkdir, readFile, writeFile, writeAsJson} from '@deflock/fs';
import {sha1} from '@deflock/crypto';
import AbstractProcessor from './abstract-processor';

/**
 *
 */
export default class GenericProcessor extends AbstractProcessor {
    /**
     * @param {Object} options
     */
    constructor(options = {}) {
        super();

        this.options = Object.assign({
            processMode: 'parallel',
        }, options);

        this.name = this.options.name || this.constructor.name;
    }

    /**
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<*>}
     */
    async process(files, params) {
        params.log(`[${this.name}] process()`);
        return this.options.processMode === 'series'
            ? this.doProcessSeries(files, params)
            : this.doProcessParallel(files, params);
    }

    /**
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async doProcessSeries(files, params) {
        let promise = Promise.resolve();

        files.forEach(file => {
            promise = promise.then(() => this.doGetFilterProcessPromise(file, params));
        });

        return promise;
    }

    /**
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<any[]>}
     */
    async doProcessParallel(files, params) {
        const promises = [];

        files.forEach(file => {
            promises.push(this.doGetFilterProcessPromise(file, params));
        });

        return Promise.all(promises);
    }

    /**
     * @param {Object|Array} file
     * @param {Object} params
     * @returns {Promise}
     */
    doGetFilterProcessPromise(file, params) {
        // If you do not know how exactly async/await/generator works
        // better use promises instead
        return this.defaultFilterAsync(file, params)
            .then(result => {
                if (result === false) {
                    return;
                }
                return this.filterAsync(file, params)
                    .then(result => {
                        if (result === false) {
                            return;
                        }

                        if (this.defaultFilterSync(file, params) === false) {
                            return;
                        }

                        if (this.filterSync(file, params) === false) {
                            return;
                        }

                        params.log(`[${this.name}] doProcess()`, file.path, file.state);
                        return this.doProcess(file, params);
                    });
            });
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async doProcess(file, params) {
        switch (file.state) {
            case 'init':
                return this.onInit(file, params);
            case 'add':
                return this.onAdd(file, params);
            case 'change':
                return this.onChange(file, params);
            case 'unlink':
                return this.onUnlink(file, params);
            default:
                return this.onOtherEvent(file, params);
        }
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onInit(file, params) {
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onAdd(file, params) {
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onChange(file, params) {
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onUnlink(file, params) {
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onOtherEvent(file, params) {
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<boolean>}
     */
    async filterAsync(file, params) {
        return true;
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {boolean}
     */
    filterSync(file, params) {
        return true;
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<boolean>}
     */
    async defaultFilterAsync(file, params) {
        return true;
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<boolean>}
     */
    defaultFilterSync(file, params) {
        const path = file.path;
        const basedir = params.basedir || params.cwd;

        if (path) {
            if (!this.processableByPathExtensions(path)) {
                return false;
            }
            if (!this.processableByPathExclude(path, basedir)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {string} relativePath
     * @return {boolean}
     */
    processableByPathExtensions(relativePath) {
        if (!this.hasOption('extensions')) {
            return true;
        }

        const extensionsOption = this.getOption('extensions');

        if (!extensionsOption) {
            return true;
        }

        if (Array.isArray(extensionsOption) && extensionsOption.length === 0) {
            return false;
        }

        return pathMatchesExtension(relativePath, extensionsOption);
    }

    /**
     * @param {string} relativePath
     * @param {string|null} basedir
     * @return {boolean}
     */
    processableByPathExclude(relativePath, basedir = null) {
        if (!this.hasOption('exclude')) {
            return true;
        }

        const excludeOption = this.getOption('exclude');

        if (!excludeOption) {
            return true;
        }

        if (basedir == null) {
            // eslint-disable-next-line no-param-reassign
            basedir = process.cwd();
        }

        for (const exclude of excludeOption) {
            if (exclude instanceof RegExp) {
                if (exclude.test(relativePath)) {
                    return false;
                }
            } else {
                if (nodepath.resolve(basedir, relativePath)
                    .indexOf(nodepath.resolve(basedir, exclude)) === 0
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @param {string|Array} option
     * @returns {boolean}
     */
    hasOption(option) {
        try {
            this.getOption(option);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @param {string|Array} option
     * @returns {*}
     */
    getOption(option) {
        if (typeof option === 'string') {
            option = option.split('.');
        } else if (!Array.isArray(option)) {
            throw new Error('Option must be a string or an array');
        }

        let options = this.options;

        for (let i = 0; i < option.length; i++) {
            if (!Object.prototype.hasOwnProperty.call(options, option[i])) {
                throw new Error(`Option "${option.join('.')}" not found`);
            }
            options = options[option[i]];
        }

        return options;
    }

    /**
     * @param {string} path
     * @param {string} content
     * @param {string|Object} options
     * @param {Object} mkdirOptions
     * @returns {Promise<void>}
     */
    async writeFile(path, content, options, mkdirOptions) {
        return writeFile(path, content, options, mkdirOptions);
    }

    /**
     * @param {string} path
     * @param {*} value
     * @param {string|Object} options
     * @param {Object} mkdirOptions
     * @returns {Promise<void>}
     */
    async writeAsJson(path, value, options, mkdirOptions) {
        return writeAsJson(path, value, options, mkdirOptions);
    }

    /**
     * @param {string} path
     * @param {Object} options
     * @returns {Promise<*>}
     */
    async readFile(path, options) {
        return readFile(path, options);
    }

    /**
     * @param {string} path
     * @param {string} destDir
     * @param {string} filenamePattern
     * @returns {Promise<*>}
     */
    async copyFile(path, destDir, filenamePattern) {
        const content = await this.readFile(path);
        const filename = await this.interpolateFilename(filenamePattern, {
            content,
            srcFile: path,
        });
        const destPath = nodepath.resolve(destDir, filename);

        await mkdir(nodepath.dirname(destPath));

        return new Promise((resolve, reject) => {
            nodefs.copyFile(path, destPath, err => {
                if (err) {
                    reject(err);
                }
                resolve(destPath);
            });
        });
    }

    /**
     * @param {string} path
     * @param {string} destDir
     * @param {string} filenamePattern
     * @returns {Promise<*>}
     */
    async moveFile(path, destDir, filenamePattern) {
        const content = await this.readFile(path);
        const filename = await this.interpolateFilename(filenamePattern, {
            content,
            srcFile: path,
        });
        const destPath = nodepath.resolve(destDir, filename);

        await mkdir(nodepath.dirname(destPath));

        return new Promise((resolve, reject) => {
            nodefs.rename(path, destPath, err => {
                if (err) {
                    reject(err);
                }
                resolve(destPath);
            });
        });
    }

    /**
     * @param {string} pattern
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async interpolateFilename(pattern, params) {
        let filename = pattern;

        if (pattern.indexOf('[contentHash') > -1) {
            if (typeof params.content === 'undefined') {
                throw new Error('Content must be specified if [contentHash] is used');
            }

            const contentHash = sha1(params.content);

            filename = filename.replace(
                /\[contentHash:(\d+?)\]/g,
                (m, hlen) => contentHash.substr(0, +hlen)
            );

            filename = filename.replace(/\[contentHash\]/g, () => contentHash);
        }

        if (pattern.indexOf('[ext]') > -1) {
            if (typeof params.srcFile === 'undefined') {
                throw new Error('Content must be specified if [contentHash] is used');
            }

            filename = filename.replace(
                /\[ext\]/g,
                () => trimCharsLeft(nodepath.extname(params.srcFile), '.')
            );
        }

        return filename;
    }
}
