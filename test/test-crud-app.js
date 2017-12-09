'use strict';

const should = require('chai').should;
const expect = require('chai').expect;

const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const request = require('request');

const configServer = require('./../index.js');

const ADMIN_TOKEN = 'd8745e9d03be41ad817a47176ade4dcc';
let workspaceId = '6ba955dde3044b6687af7b4d05a64920';
let appId = 'b84cdbefe8ab42d38df0aa415030c4a1';
let appSecret = 'fd39eb34e94d41008cc0e196fdc5fc17';
let clientId = '4364938982b54da1807c599a955cdfcc';

const configServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/config-server-config.yaml'));
configServer.setConfig(configServerConfigYaml);

const testImportJsonConfig = require('./test-server/test-import-config.json');

describe('Test CRUD App', function () {
    this.timeout(5000);

    var importConfig = async function () {

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
        })
    }

    beforeEach(function (done) {
        configServer.run().then(_ => {
            configServer.getConfigDataStore().reset();
            importConfig().then(_ => {
                done()
            });
        });
    });

    it("Test get app", function (done) {

        var expectedAppResponse = {
            appId: appId,
            secret: appSecret,
            displayName: 'Petstore',
            workspaceId: workspaceId,
            openAPISpecLastUpdateTime: 0,
            quotaRule: {
                'plan a': {
                    app: [{
                        "bucket": "1m",
                        "quota": 100000000
                    }],
                    tag: {
                        "store": [{
                            "bucket": "1m",
                            "quota": 100000000
                        }]
                    },
                    operation: {
                        "placeOrder": [{
                            "bucket": "1m",
                            "quota": 100000000
                        }]
                    }
                }
            },
            //createTime: 1512802829570,
            //updateTime: 1512802829570,
            _links: {
                self: { href: `/config/workspaces/${workspaceId}/apps/${appId}` },
                workspace: { href: `/config/workspaces/${workspaceId}` }
            }
        }

        request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${appId}`, {
                method: 'GET',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(200);
                    let app = body;
                    console.log(app)
                    expect(app.createTime).to.gt(0);
                    expect(app.updateTime).to.gt(0);
                    delete app.createTime;
                    delete app.updateTime;
                    expect(app).to.eqls(expectedAppResponse)
                    done();
                }
            });
    });
    
        it("Test create app", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/apps`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN,
                    },
                    json: true,
                    body: {
                        displayName: 'Demo App 2'
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        expect(response.statusCode).to.equal(201);
                        expect(response.headers.location).to.not.be.null;
                        let newAppLocation = response.headers.location;
                        let newAppId = newAppLocation.substr(newAppLocation.lastIndexOf('/') + 1);
                        expect(response.headers.location).to.equal(`/config/workspaces/${workspaceId}/apps/${newAppId}`);

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${newAppId}`, {
                                method: 'GET',
                                headers: {
                                    'id-key': ADMIN_TOKEN,
                                },
                                json: true,
                                body: {
                                    displayName: 'Demo App 2'
                                }
                            },
                            function (error, response, body) {
                                if (error) {
                                    done(error);
                                }
                                let workspace = body;
                                expect(workspace.createTime).to.gt(0);
                                expect(workspace.updateTime).to.gt(0);
                                expect(workspace.displayName).to.equal('Demo App 2');
                                expect(workspace.secret).to.not.be.null;
                                done();
                            });

                    }
                });
        });

        it("Test update app", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${appId}`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN,
                    },
                    json: true,
                    body: {
                        displayName: 'Demo App updated'
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        expect(response.statusCode).to.equal(204);

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${appId}`, {
                                method: 'GET',
                                headers: {
                                    'id-key': ADMIN_TOKEN,
                                },
                                json: true
                            },
                            function (error, response, body) {
                                if (error) {
                                    done(error);
                                }
                                let workspace = body;
                                expect(workspace.createTime).to.gt(0);
                                expect(workspace.updateTime).to.gt(0);
                                expect(workspace.displayName).to.equal('Demo App updated');
                                expect(workspace.secret).to.not.be.null;
                                done();
                            });

                    }
                });
        });

        it("Test delete app", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${appId}`, {
                    method: 'DELETE',
                    headers: {
                        'id-key': ADMIN_TOKEN,
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        expect(response.statusCode).to.equal(204);

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/apps/${appId}`, {
                                method: 'GET',
                                headers: {
                                    'id-key': ADMIN_TOKEN,
                                },
                                json: true
                            },
                            function (error, response, body) {
                                if (error) {
                                    done(error);
                                }
                                expect(response.statusCode).to.equal(404);
                                done();
                            });

                    }
                });
        });

    afterEach(function (done) {
        configServer.shutdown().then(() => {
            done();
        });
    });
});