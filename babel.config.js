'use strict';

module.exports = (api) => {
    api.env();

    return {
        presets: [
            ["@babel/preset-env", {
                "targets": {
                    "node": "8",
                },
                "modules": "commonjs",
            }],
        ],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-optional-catch-binding',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-throw-expressions',
        ],
    };
};
