/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  server: {
    gulpConfig: ['gulpfile.js'],
    allJS: ['index.js', 'server/config/**/*.js', 'server/modules/**/*.js'],
    models: 'server/modules/*/models/*.js',
    routes: ['server/modules/*/routes/*.js'],
    sockets: 'server/modules/*/sockets/**/*.js',
    config: ['server/modules/*/config/*.js'],
    policies: 'server/modules/*/policies/*.js',
    seedScripts: 'server/utils/seedScripts/*seed.script.js',
  }
};
