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
let clientId = '4364938982b54da1807c599a955cdfcc';
let clientSecret = '4af18e30-85b6-4c14-aecd-c489d404a179';

const configServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/config-server-config.yaml'));
configServer.setConfig(configServerConfigYaml);

const testImportJsonConfig = require('./test-server/test-import-config.json');

describe('Test CRUD Client', function () {
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

    it("Test get client", function (done) {

        var expectedAppResponse = {
            clientId: clientId,
            secret: clientSecret,
            displayName: "Client A",
            workspaceId: workspaceId,
            plans: {
                "b84cdbefe8ab42d38df0aa415030c4a1": ["plan a"]
            },
            //createTime: 1512802829570,
            //updateTime: 1512802829570,
            _links: {
                self: { href: `/config/workspaces/${workspaceId}/clients/${clientId}` },
                workspace: { href: `/config/workspaces/${workspaceId}` }
            }
        }

        request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${clientId}`, {
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
    
        it("Test create client", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/clients`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN,
                    },
                    json: true,
                    body: {
                        displayName: 'Demo Client 2'
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        expect(response.statusCode).to.equal(201);
                        expect(response.headers.location).to.not.be.null;
                        let newAppLocation = response.headers.location;
                        let newClientId = newAppLocation.substr(newAppLocation.lastIndexOf('/') + 1);
                        expect(response.headers.location).to.equal(`/config/workspaces/${workspaceId}/clients/${newClientId}`);

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${newClientId}`, {
                                method: 'GET',
                                headers: {
                                    'id-key': ADMIN_TOKEN,
                                },
                                json: true,
                                body: {
                                    displayName: 'Demo Client 2'
                                }
                            },
                            function (error, response, body) {
                                if (error) {
                                    done(error);
                                }
                                let workspace = body;
                                expect(workspace.createTime).to.gt(0);
                                expect(workspace.updateTime).to.gt(0);
                                expect(workspace.displayName).to.equal('Demo Client 2');
                                expect(workspace.secret).to.not.be.null;
                                done();
                            });

                    }
                });
        });

        it("Test update client", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${clientId}`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN,
                    },
                    json: true,
                    body: {
                        displayName: 'Demo Client updated'
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        expect(response.statusCode).to.equal(204);

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${clientId}`, {
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
                                expect(workspace.displayName).to.equal('Demo Client updated');
                                expect(workspace.secret).to.not.be.null;
                                done();
                            });

                    }
                });
        });

        it("Test delete client", function (done) {

            request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${clientId}`, {
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

                        request(`http://localhost:3001/config/workspaces/${workspaceId}/clients/${clientId}`, {
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