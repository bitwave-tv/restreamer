/**
 * @file this file is loaded on application start and initializes the application
 * @link https://github.com/datarhei/restreamer
 * @copyright 2015 datarhei.org
 * @license Apache-2.0
 */
'use strict';
const path = require('path');

global.__src = __dirname;
global.__base = path.join(__dirname, '..');
global.__public = path.join(__dirname, 'webserver', 'public');

const config = require(path.join(global.__base, 'conf', 'live.json'));
const env = require('./classes/EnvVar');

// setup environment vars
env.init(config);

const CFonts = require('cfonts');
const packageJson = require(path.join('..', 'package.json'));
const logger = require('./classes/Logger')('start');
const nginxrtmp = require('./classes/Nginxrtmp')(config);
const Q = require('q');
const Restreamer = require('./classes/Restreamer');
const RestreamerData = require('./classes/RestreamerData');
const restreamerApp = require('./webserver/app');

if (process.env.RS_DEBUG == "true" ) {
    logger.info('Debugging enabled. Check the /debug path in the web interface.', false);
}

// show start message
logger.info('Starting [bitwave.tv] restreamer');
logger.info(CFonts.render('bitwave', {
    font: 'simple3d',
    color: '#0f0',
}).string);
logger.info('', false);
logger.info('Restreamer v' + packageJson.version, false);
logger.info('', false);
logger.info('ENVIRONMENTS', false);
logger.info('More information in our Docs', false);
logger.info('', false);

// list environment variables
env.list(logger);

// bail out if there are errors
if (env.hasErrors()) {
    process.exit();
}

// start the app
nginxrtmp.start(process.env.RS_HTTPS == "true")
    .then(() => {
        return RestreamerData.checkJSONDb();
    })
    .then(() => {
        Restreamer.checkForUpdates();
        Restreamer.getPublicIp();
        Restreamer.bindWebsocketEvents();
        return restreamerApp.startWebserver();
    })
    .then(() => {
        return Q.fcall(Restreamer.restoreProcesses);
    })
    .catch((error) => {
        logger.error('Error starting webserver and nginx for application: ' + error);
    });
