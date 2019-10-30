/**
 * @file controller for routing from /v1
 * @link https://github.com/datarhei/restreamer
 * @copyright 2015 datarhei.org
 * @license Apache-2.0
 */
'use strict';

const express = require('express');
const router = new express.Router();
const version = require(require('path').join(global.__base, 'package.json')).version;

// TODO: solve the circular dependency problem and place Restreamer require here

router.get('/version', (req, res) => {
    res.json({
        version: version,
        update: require.main.require('./classes/Restreamer').data.updateAvailable,
    });
});

router.get('/ip', (req, res) => {
    res.end(require.main.require('./classes/Restreamer').data.publicIp);
});

router.get('/status', (req, res) => {
    const states = require.main.require('./classes/Restreamer').data.states;

    const response = {
        repeat_to_local_nginx: {
            type: states.repeatToLocalNginx.type,
            message: states.repeatToLocalNginx.message.replace(/\?token=[^\s]+/, '?token=***'),
        },
        repeat_to_optional_output: {
            type: states.repeatToOptionalOutput.type,
            message: states.repeatToOptionalOutput.message.replace(/\?token=[^\s]+/, '?token=***'),
        },
    };

    res.json(response);
});

router.get('/progresses', (req, res) => {
    const progresses = require.main.require('./classes/Restreamer').data.progresses;

    res.json({
        repeat_to_local_nginx: {
            frames: progresses.repeatToLocalNginx.frames,
            current_fps: progresses.repeatToLocalNginx.currentFps,
            current_kbps: progresses.repeatToLocalNginx.currentKbps,
            target_size: progresses.repeatToLocalNginx.targetSize,
            timemark: progresses.repeatToLocalNginx.timemark,
        },
        repeat_to_optional_output: {
            frames: progresses.repeatToOptionalOutput.frames,
            current_fps: progresses.repeatToOptionalOutput.currentFps,
            current_kbps: progresses.repeatToOptionalOutput.currentKbps,
            target_size: progresses.repeatToOptionalOutput.targetSize,
            timemark: progresses.repeatToOptionalOutput.timemark,
        },
    });
});

router.post('/start', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    const url = req.body.src;

    const opt = {
        src: url,
        options: restreamer.data.options,
        streamType: 'repeatToLocalNginx',
        optionalOutput: null,
    };

    restreamer.updateUserAction(opt.streamType, 'start');
    restreamer.startStream(url, opt.streamType);

    res.send({
        data: restreamer.data,
    });
});

router.post('/stop', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    const streamType = 'repeatToLocalNginx';

    restreamer.updateUserAction(streamType, 'stop');
    restreamer.stopStream(streamType);

    res.send({
        data: restreamer.data,
    });
});

router.post('/start-relay', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    const server = req.body.server;
    const key = req.body.key;
    const url = `${server}/${key}`;

    const streamType = 'repeatToOptionalOutput';

    const opt = {
        src: null,
        options: null,
        streamType: streamType,
        optionalOutput: url,
    };

    restreamer.updateUserAction(opt.streamType, 'start');
    restreamer.startStream(url, opt.streamType);

    res.send({
        data: restreamer.data,
    });
});

router.post('/stop-relay', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    const streamType = 'repeatToOptionalOutput';

    restreamer.updateUserAction(streamType, 'stop');
    restreamer.stopStream(streamType);

    res.send({
        data: restreamer.data,
    });
});

router.post('/options', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    const options = {
        rtspTcp: false,
        video: {
            codec: 'copy',
            preset: 'ultrafast',
            bitrate: '4096',
            fps: '25',
            profile: 'auto',
            tune: 'none',
        },
        audio: {
            codec: 'auto',
            preset: 'silence',
            bitrate: '64',
            channels: 'mono',
            sampling: '44100',
        },
        player: {
            autoplay: false,
            mute: false,
            statistics: false,
            color: '#3daa48',
            logo: {
                image: '',
                position: 'bottom-right',
                link: '',
            },
        },
    };

    restreamer.updateOptions(options);
});

router.get('/options', (req, res) => {
    const restreamer = require.main.require('./classes/Restreamer');

    res.send({
        data: restreamer.data.options,
    });
});

module.exports = router;
