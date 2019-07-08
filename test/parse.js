'use strict';

const path = require('path');
const EOL = require('os').EOL;
const chai = require('chai');
chai.should();

const expect = chai.expect;
const parse = require('../').parse;

describe('parse', () => {

    it('using connection string in client constructor', () => {
        const subject = parse('postgres://brian:pw@boom:381/lala');
        subject.user.should.equal('brian');
        subject.password.should.equal('pw');
        subject.host.should.equal('boom');
        subject.port.should.equal(381);
        subject.database.should.equal('lala');
    });

    it('escape spaces and pluses if present', () => {
        const subject1 = parse('postgres://localhost/post+gres');
        subject1.database.should.equal('post gres');
        const subject2 = parse('postgres://localhost/post%20gres');
        subject2.database.should.equal('post gres');
    });

    it('do not double escape spaces', () => {
        const subject = parse('postgres://localhost/post%20gres');
        subject.database.should.equal('post gres');
    });

    it('initializing with unix domain socket', () => {
        const subject1 = parse('?socket=' + encodeURIComponent('/const/run/'));
        subject1.host.should.equal('/const/run/');
        const subject2 = parse('test.domain.sock');
        subject2.host.should.equal('test.domain.sock');
    });

    it('initializing with unix domain socket and a specific database, the simple way', () => {
        const subject = parse('/mydb?socket=' + encodeURIComponent('/const/run/'));
        subject.host.should.equal('/const/run/');
        subject.database.should.equal('mydb');
    });

    it('initializing with unix domain socket, the healthy way', () => {
        const subject = parse('/my%5Bdb%5D?encoding=utf8&socket=' + encodeURIComponent('/some path/'));
        subject.host.should.equal('/some path/');
        subject.database.should.equal('my[db]', 'must to be escaped and unescaped trough "my%5Bdb%5D"');
        subject.client_encoding.should.equal('utf8');
    });

    it('initializing with unix domain socket, the escaped healthy way', () => {
        const subject = parse('/my%2Bdb?encoding=utf8&socket=' + encodeURIComponent('/some path/'));
        subject.host.should.equal('/some path/');
        subject.database.should.equal('my+db');
        subject.client_encoding.should.equal('utf8');
    });

    it('initializing with unix domain socket, username and password', () => {
        const subject = parse('postgres://brian:pw@/mydb?socket=' + encodeURIComponent('/const/run/'));
        subject.user.should.equal('brian');
        subject.password.should.equal('pw');
        subject.host.should.equal('/const/run/');
        subject.database.should.equal('mydb');
    });

    it('password contains  < and/or >  characters', () => {
        const sourceConfig = {
            user: 'brian',
            password: 'hello<ther>e',
            port: 5432,
            host: 'localhost',
            database: 'postgres'
        };
        const connectionString = 'postgres://' + sourceConfig.user + ':' + encodeURIComponent(sourceConfig.password) + '@' + sourceConfig.host + ':' + sourceConfig.port + '/' + sourceConfig.database;
        const subject = parse(connectionString);
        subject.password.should.equal(sourceConfig.password);
    });

    it('password contains colons', () => {
        const sourceConfig = {
            user: 'brian',
            password: 'hello:pass:world',
            port: 5432,
            host: 'localhost',
            database: 'postgres'
        };
        const connectionString = 'postgres://' + sourceConfig.user + ':' + encodeURIComponent(sourceConfig.password) + '@' + sourceConfig.host + ':' + sourceConfig.port + '/' + sourceConfig.database;
        const subject = parse(connectionString);
        subject.password.should.equal(sourceConfig.password);
    });

    it('url is properly encoded', () => {
        const encoded = 'pg://bi%25na%25%25ry%20:s%40f%23@localhost/%20u%2520rl';
        const subject = parse(encoded);
        subject.user.should.equal('bi%na%%ry ');
        subject.password.should.equal('s@f#');
        subject.host.should.equal('localhost');
        subject.database.should.equal(' u%20rl');
    });

    it('relative url sets database', () => {
        const relative = '/different_db_on_default_host';
        const subject = parse(relative);
        subject.database.should.equal('different_db_on_default_host');
    });

    it('no pathname returns undefined database', () => {
        const subject = parse('pg://myhost');
        (subject.database === undefined).should.equal(true);
    });

    it('pathname of "/" returns undefined database', () => {
        const subject = parse('pg://myhost/');
        subject.host.should.equal('myhost');
        (subject.database === undefined).should.equal(true);
    });

    it('configuration parameter application_name', () => {
        const connectionString = 'pg:///?application_name=TheApp';
        const subject = parse(connectionString);
        subject.application_name.should.equal('TheApp');
    });

    it('configuration parameter fallback_application_name', () => {
        const connectionString = 'pg:///?fallback_application_name=TheAppFallback';
        const subject = parse(connectionString);
        subject.fallback_application_name.should.equal('TheAppFallback');
    });

    it('configuration parameter fallback_application_name', () => {
        const connectionString = 'pg:///?fallback_application_name=TheAppFallback';
        const subject = parse(connectionString);
        subject.fallback_application_name.should.equal('TheAppFallback');
    });

    it('configuration parameter ssl=true', () => {
        const connectionString = 'pg:///?ssl=true';
        const subject = parse(connectionString);
        subject.ssl.should.equal(true);
    });

    it('configuration parameter ssl=1', () => {
        const connectionString = 'pg:///?ssl=1';
        const subject = parse(connectionString);
        subject.ssl.should.equal(true);
    });

    it('configuration parameter ssl=0', () => {
        const connectionString = 'pg:///?ssl=0';
        const subject = parse(connectionString);
        subject.ssl.should.equal(false);
    });

    it('set ssl', () => {
        const subject = parse('pg://myhost/db?ssl=1');
        subject.ssl.should.equal(true);
    });

    it('configuration parameter sslcert=/path/to/cert', () => {
        const connectionString = 'pg:///?sslcert=' + encodeURIComponent(path.join(__dirname, '/example.cert'));
        const subject = parse(connectionString);
        subject.ssl.should.eql({
            cert: 'example cert' + EOL
        });
    });

    it('configuration parameter sslkey=/path/to/key', () => {
        const connectionString = 'pg:///?sslkey=' + encodeURIComponent(path.join(__dirname, 'example.key'));
        const subject = parse(connectionString);
        subject.ssl.should.eql({
            key: 'example key' + EOL
        });
    });

    it('configuration parameter sslrootcert=/path/to/ca', () => {
        const connectionString = 'pg:///?sslrootcert=' + encodeURIComponent(path.join(__dirname, 'example.ca'));
        const subject = parse(connectionString);
        subject.ssl.should.eql({
            ca: 'example ca' + EOL
        });
    });

    it('allow other params like max, ...', () => {
        const subject = parse('pg://myhost/db?max=18&min=4');
        subject.max.should.equal('18');
        subject.min.should.equal('4');
    });


    it('configuration parameter keepalives', () => {
        const connectionString = 'pg:///?keepalives=1';
        const subject = parse(connectionString);
        subject.keepalives.should.equal('1');
    });

    it('unknown configuration parameter is passed into client', () => {
        const connectionString = 'pg:///?ThereIsNoSuchPostgresParameter=1234';
        const subject = parse(connectionString);
        subject.ThereIsNoSuchPostgresParameter.should.equal('1234');
    });

    it('do not override a config field with value from query string', () => {
        const subject = parse('postgres://some-path.socket/my%5Bdb%5D?encoding=utf8&client_encoding=bogus');
        subject.host.should.equal('some-path.socket');
        subject.database.should.equal('my[db]', 'must to be escaped and unescaped through "my%5Bdb%5D"');
        subject.client_encoding.should.equal('utf8');
    });

    it('must throw on repeated parameters', () => {
        const connectionString = 'pg:///?keepalives=1&keepalives=0';
        expect(() => {
            parse(connectionString);
        }).throw('Parameter "keepalives" is repeated.');
    });
});
