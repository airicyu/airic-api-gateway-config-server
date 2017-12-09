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
let workspaceSecret = 'c376f991c6744cfea1ccdad23356ab10';
let appId = 'b84cdbefe8ab42d38df0aa415030c4a1';
let clientId = '4364938982b54da1807c599a955cdfcc';

const configServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/config-server-config.yaml'));
configServer.setConfig(configServerConfigYaml);

const testImportJsonConfig = require('./test-server/test-import-config.json');

describe('Test CRUD Workspace', function () {
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

    it("Test get workspace", function (done) {

        var expectedWorkspaceResponse = {
            workspaceId: workspaceId,
            secret: workspaceSecret,
            displayName: 'Demo Workspace',
            //createTime: 1512800695591,
            //updateTime: 1512800695591,
            _links: {
                self: { href: `/config/workspaces/${workspaceId}` },
                apps: { href: `/config/workspaces/${workspaceId}/apps` },
                clients: { href: `/config/workspaces/${workspaceId}/clients` }
            }
        };

        request(`http://localhost:3001/config/workspaces/${workspaceId}`, {
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
                    let workspace = body;
                    expect(workspace.createTime).to.gt(0);
                    expect(workspace.updateTime).to.gt(0);
                    delete workspace.createTime;
                    delete workspace.updateTime;
                    expect(workspace).to.eqls(expectedWorkspaceResponse)
                    done();
                }
            });
    });

    it("Test create workspace", function (done) {

        request(`http://localhost:3001/config/workspaces`, {
                method: 'POST',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true,
                body: {
                    displayName: 'Demo Workspace 2'
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(201);
                    expect(response.headers.location).to.not.be.null;
                    let newWorkspaceLocation = response.headers.location;
                    let newWorkspaceId = newWorkspaceLocation.substr(newWorkspaceLocation.lastIndexOf('/') + 1);
                    expect(response.headers.location).to.equal(`/config/workspaces/${newWorkspaceId}`);

                    request(`http://localhost:3001/config/workspaces/${newWorkspaceId}`, {
                            method: 'GET',
                            headers: {
                                'id-key': ADMIN_TOKEN,
                            },
                            json: true,
                            body: {
                                displayName: 'Demo Workspace 2'
                            }
                        },
                        function (error, response, body) {
                            if (error) {
                                done(error);
                            }
                            let workspace = body;
                            expect(workspace.createTime).to.gt(0);
                            expect(workspace.updateTime).to.gt(0);
                            expect(workspace.displayName).to.equal('Demo Workspace 2');
                            expect(workspace.secret).to.not.be.null;
                            done();
                        });

                }
            });
    });

    it("Test update workspace", function (done) {

        request(`http://localhost:3001/config/workspaces/${workspaceId}`, {
                method: 'POST',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true,
                body: {
                    displayName: 'Demo Workspace updated'
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(204);

                    request(`http://localhost:3001/config/workspaces/${workspaceId}`, {
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
                            expect(workspace.displayName).to.equal('Demo Workspace updated');
                            expect(workspace.secret).to.not.be.null;
                            done();
                        });

                }
            });
    });

    it("Test delete workspace", function (done) {

        request(`http://localhost:3001/config/workspaces/${workspaceId}`, {
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

                    request(`http://localhost:3001/config/workspaces/${workspaceId}`, {
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