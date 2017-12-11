'use strict';

const should = require('chai').should;
const expect = require('chai').expect;

const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const request = require('request');
const jwt = require('jsonwebtoken');

const configServer = require('./../index.js');

const ADMIN_TOKEN = 'd8745e9d03be41ad817a47176ade4dcc';
let workspaceId = '6ba955dde3044b6687af7b4d05a64920';
let workspaceSecret = 'c376f991c6744cfea1ccdad23356ab10';
let appId = 'b84cdbefe8ab42d38df0aa415030c4a1';
let appSecret = 'fd39eb34e94d41008cc0e196fdc5fc17';
let clientId = '4364938982b54da1807c599a955cdfcc';

const configServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/config-server-config.yaml'));
configServer.setConfig(configServerConfigYaml);

const testImportJsonConfig = require('./test-server/test-import-config.json');

describe('Test API Key services', function () {
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

    var generateWorkspaceIdToken = async function () {
        return new Promise((resolve, reject) => {
            request(`http://localhost:3001/keys/workspaces/${workspaceId}/id-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        })
    };

    var generateAppIdToken = async function () {
        return new Promise((resolve, reject) => {
            request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        })
    };

    var generateApiToken = async function () {
        return new Promise((resolve, reject) => {
            request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    body: {
                        "clientId": clientId,
                        "state": "123"
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        })
    };

    it("Test generate API key with Admin Token", function (done) {
        request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                method: 'POST',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true,
                body: {
                    "clientId": clientId,
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    let token = body;
                    let decodedToken = jwt.decode(token);
                    expect(decodedToken).to.not.be.null;
                    expect(decodedToken['token-type']).to.equal('apiKey');
                    expect(decodedToken['appId']).to.equal(appId);
                    expect(decodedToken['clientId']).to.equal(clientId);
                    expect(decodedToken['workspaceId']).to.equal(workspaceId);
                    expect(decodedToken['ver']).to.equal('1');
                    expect(decodedToken['state']).to.equal('123');
                    expect(decodedToken['iat']).to.gt(0);
                    done();
                }
            });
    });

    it("Test generate API key with workspace ID Token", function (done) {
        generateWorkspaceIdToken().then(workspaceIdToken => {
            request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': workspaceIdToken,
                    },
                    json: true,
                    body: {
                        "clientId": clientId,
                        "state": "123"
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let token = body;
                        let decodedToken = jwt.decode(token);
                        expect(decodedToken).to.not.be.null;
                        expect(decodedToken['token-type']).to.equal('apiKey');
                        expect(decodedToken['appId']).to.equal(appId);
                        expect(decodedToken['clientId']).to.equal(clientId);
                        expect(decodedToken['workspaceId']).to.equal(workspaceId);
                        expect(decodedToken['ver']).to.equal('1');
                        expect(decodedToken['state']).to.equal('123');
                        expect(decodedToken['iat']).to.gt(0);
                        done();
                    }
                });
        })
    });

    it("Test generate API key with app ID Token", function (done) {
        generateAppIdToken().then(appIdToken => {
            request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': appIdToken,
                    },
                    json: true,
                    body: {
                        "clientId": clientId,
                        "state": "123"
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let token = body;
                        let decodedToken = jwt.decode(token);
                        expect(decodedToken).to.not.be.null;
                        expect(decodedToken['token-type']).to.equal('apiKey');
                        expect(decodedToken['appId']).to.equal(appId);
                        expect(decodedToken['clientId']).to.equal(clientId);
                        expect(decodedToken['workspaceId']).to.equal(workspaceId);
                        expect(decodedToken['ver']).to.equal('1');
                        expect(decodedToken['state']).to.equal('123');
                        expect(decodedToken['iat']).to.gt(0);
                        done();
                    }
                });
        })
    });

    it("Test generate API key with invalid token", function (done) {
        request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                method: 'POST',
                headers: {
                    'id-key': "abc",
                },
                json: true,
                body: {
                    "clientId": clientId,
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate API key without auth", function (done) {
        request(`http://localhost:3001/keys/workspaces/${workspaceId}/apps/${appId}/api-keys`, {
                method: 'POST',
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test verify api token", function (done) {
        generateApiToken().then((apiToken) => {
            request(`http://localhost:3001/keys/api-keys/verification`, {
                    method: 'POST',
                    json: true,
                    body: {
                        'key': apiToken,
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let expectedResponse = {
                            "result": true,
                            "token": {
                                "header": {
                                    "alg": "RS256",
                                    "typ": "JWT",
                                    "fingerprint": "fb:9c:c7:74:64:cb:c3:39:ec:18:fd:69:99:e9:af:26"
                                },
                                "payload": {
                                    "token-type": "apiKey",
                                    "appId": appId,
                                    "clientId": clientId,
                                    "workspaceId": workspaceId,
                                    "ver": "1",
                                    "state": "123",
                                    //"iat": 1513015977
                                }
                            }
                        };

                        expect(body.token.payload.iat).to.gt(0);
                        delete body.token.payload.iat;
                        expect(body).to.eqls(expectedResponse);
                        done();
                    }
                });
        });
    });

    
    it("Test verify API token without token", function (done) {
        request(`http://localhost:3001/keys/api-keys/verification`, {
            method: 'POST',
            json: true
        },
        function (error, response, body) {
            if (error) {
                done(error);
            } else {
                let expectedResponse = {result: false, code: 400, message: "Invalid key"};
                expect(body).to.eqls(expectedResponse);
                done();
            }
        });
    });

    it("Test verify invalid API token", function (done) {
        request(`http://localhost:3001/keys/api-keys/verification`, {
            method: 'POST',
            json: true,
            body: {
                'key': "abc",
            }
        },
        function (error, response, body) {
            if (error) {
                done(error);
            } else {
                let expectedResponse = {result: false, code: 400, message: "Invalid key"};
                expect(body).to.eqls(expectedResponse);
                done();
            }
        });
    });

    afterEach(function (done) {
        configServer.shutdown().then(() => {
            done();
        });
    });
});