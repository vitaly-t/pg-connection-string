'use strict';

const fs = require('fs');
const ConnectionString = require('connection-string').ConnectionString;

// parses a connection string
function parse(str) {

    const cs = new ConnectionString(str);

    const config = cs.params ? Object.assign({}, cs.params) : {};

    // In this version we ignore multi-host support, using compatibility properties for the first host + port:
    config.host = cs.hostname;
    config.port = cs.port;

    config.database = cs.path && cs.path[0];
    config.user = cs.user;
    config.password = cs.password;

    if (config.encoding) {
        config.client_encoding = config.encoding;
    }

    if (cs.hosts && cs.hosts[0].type === 'socket') {
        return config;
    }

    if (config.ssl === 'true' || config.ssl === '1') {
        config.ssl = true;
    }

    if (config.ssl === '0') {
        config.ssl = false;
    }

    if (config.sslcert || config.sslkey || config.sslrootcert) {
        config.ssl = {};
    }

    if (config.sslcert) {
        config.ssl.cert = fs.readFileSync(config.sslcert).toString();
    }

    if (config.sslkey) {
        config.ssl.key = fs.readFileSync(config.sslkey).toString();
    }

    if (config.sslrootcert) {
        config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
    }

    return config;
}

module.exports = parse;

parse.parse = parse;
