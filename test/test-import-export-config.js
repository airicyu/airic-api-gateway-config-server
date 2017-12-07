'use strict';

const should = require('chai').should;
const expect = require('chai').expect;

const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const request = require('request');

const configServer = require('./../index.js');

const ADMIN_TOKEN = 'd8745e9d03be41ad817a47176ade4dcc'

const configServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/config-server-config.yaml'));
configServer.setConfig(configServerConfigYaml)

describe('Test import config', function () {
    this.timeout(2000);

    beforeEach(function (done) {
        configServer.run().then(_ => {
            done();
        });
    });

    var importConfig = async function () {
        const testImportJsonConfig = require('./test-server/test-import-config.json');
        const hardcodeAppYaml = fs.readFileSync('./test/test-server/petStore.yaml', 'utf8');

        return new Promise((resolve, reject) => {
            request('http://localhost:3001/config/import', {
                    method: 'POST',
                    json: true,
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    body: testImportJsonConfig
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        }).then(() => {
            return new Promise((resolve, reject) => {
                request('http://localhost:3001/config/workspaces/6ba955dde3044b6687af7b4d05a64920/apps/b84cdbefe8ab42d38df0aa415030c4a1/open-api-specs', {
                        method: 'POST',
                        headers: {
                            'id-key': 'd8745e9d03be41ad817a47176ade4dcc',
                            'content-type': 'text/plain'
                        },
                        body: hardcodeAppYaml
                    },
                    function (error, response, body) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(body);
                        }
                    });
            });
        });
    }

    it("Test import config", function (done) {
        importConfig().then(done);
    });

    it("Test export all config", function (done) {

        const expectedExportJsonConfig = require('./test-server/expected-export-config.json');
        
        importConfig().then(_ => {
            return new Promise((resolve, reject) => {
                request('http://localhost:3001/config/export', {
                        method: 'GET',
                        headers: {
                            'id-key': ADMIN_TOKEN,
                        },
                        json: true
                    },
                    function (error, response, body) {
                        if (error) {
                            reject(error);
                        } else {
                            let workspace = body['workspaces']['6ba955dde3044b6687af7b4d05a64920'];
                            let app = workspace['apps']['b84cdbefe8ab42d38df0aa415030c4a1'];
                            let client = workspace['clients']['4364938982b54da1807c599a955cdfcc'];

                            expect(app['openAPISpecLastUpdateTime']).to.gt(0);
                            expect(workspace['createTime']).to.gt(0);
                            expect(workspace['updateTime']).to.gt(0);
                            expect(app['createTime']).to.gt(0);
                            expect(app['updateTime']).to.gt(0);
                            expect(client['createTime']).to.gt(0);
                            expect(client['updateTime']).to.gt(0);

                            app['openAPISpecLastUpdateTime'] = 0;
                            delete workspace['createTime'];
                            delete workspace['updateTime'];
                            delete app['createTime'];
                            delete app['updateTime'];
                            delete client['createTime'];
                            delete client['updateTime'];

                            expect(body).to.eqls(expectedExportJsonConfig);
                            resolve();
                        }
                    });
            });
        }).then(_ => {
            done();
        });

    });

    it("Test export all config with secret", function (done) {

        const expectedExportJsonConfig = require('./test-server/expected-export-with-secret-config.json');

        importConfig().then(_ => {
            return new Promise((resolve, reject) => {
                request('http://localhost:3001/config/exportWithSecret', {
                        method: 'GET',
                        headers: {
                            'id-key': ADMIN_TOKEN,
                        },
                        json: true
                    },
                    function (error, response, body) {
                        if (error) {
                            reject(error);
                        } else {
                            let workspace = body['workspaces']['6ba955dde3044b6687af7b4d05a64920'];
                            let app = workspace['apps']['b84cdbefe8ab42d38df0aa415030c4a1'];
                            let client = workspace['clients']['4364938982b54da1807c599a955cdfcc'];

                            expect(app['openAPISpecLastUpdateTime']).to.gt(0);
                            expect(workspace['createTime']).to.gt(0);
                            expect(workspace['updateTime']).to.gt(0);
                            expect(app['createTime']).to.gt(0);
                            expect(app['updateTime']).to.gt(0);
                            expect(client['createTime']).to.gt(0);
                            expect(client['updateTime']).to.gt(0);

                            app['openAPISpecLastUpdateTime'] = 0;
                            delete workspace['createTime'];
                            delete workspace['updateTime'];
                            delete app['createTime'];
                            delete app['updateTime'];
                            delete client['createTime'];
                            delete client['updateTime'];

                            expect(body).to.eqls(expectedExportJsonConfig);
                            resolve();
                        }
                    });
            });
        }).then(_ => {
            done();
        });

    });

    afterEach(function (done) {
        configServer.shutdown().then(() => {
            done();
        });
    });
});