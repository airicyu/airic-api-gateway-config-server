'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const httpShutdown = require('http-shutdown');
const jwt = require('jsonwebtoken');

const configDataStoreHolder = require('./data-store/config-data-store').dataStoreHolder;
const keysDataStoreHolder = require('./data-store/keys-data-store').dataStoreHolder;

const configIOController = require('./controllers/config-io-controller');
const workspaceController = require('./controllers/workspace-controller');
const appController = require('./controllers/app-controller');
const clientController = require('./controllers/client-controller');
const keysController = require('./controllers/keys-controller');

const workspaceModel = require('./models/workspace');
const appModel = require('./models/app');
const clientModel = require('./models/client');

const keyServiceHolder = require('./services/key-service').keyServiceHolder;

const configMemoryDataStore = require('./data-store/config-memory-data-store').dataStore;
const configSqliteDataStore = require('./data-store/config-sqlite-data-store').dataStore;
const configMongoDataStore = require('./data-store/config-mongo-data-store').dataStore;
const configMysqlDataStore = require('./data-store/config-mysql-data-store').dataStore;

const keysMemoryDataStore = require('./data-store/keys-memory-data-store').dataStore;
const keysSqliteDataStore = require('./data-store/keys-sqlite-data-store').dataStore;
const keysMysqlDataStore = require('./data-store/keys-mysql-data-store').dataStore;
const keysMongoDataStore = require('./data-store/keys-mongo-data-store').dataStore;

const configServer = {
    _app: null,
    _privateKey: null,
    _publicKey: null,
    _config: null,
    setConfig: null,
    getConfigDataStore: null,
    setConfigDataStore: null,
    getKeysDataStore: null,
    setKeysDataStore: null,
    setKeyService: null,
    inflatExpressApp: null,
    run: null,
    shutdown: null,
    implementations: {
        configDataStore: {
            configMemoryDataStore,
            configSqliteDataStore,
            configMongoDataStore,
            configMysqlDataStore
        },
        keysDataStore: {
            keysMemoryDataStore,
            keysSqliteDataStore,
            keysMongoDataStore,
            keysMysqlDataStore
        }
    }
}

configServer.setConfig = function (config) {
    this._config = config;
}.bind(configServer);

configServer.setConfigDataStore = function (dataStore) {
    configDataStoreHolder.setDataStore(dataStore);
}.bind(configServer);

configServer.getConfigDataStore = function (dataStore) {
    return configDataStoreHolder.getDataStore();
}.bind(configServer);

configServer.setKeysDataStore = function (dataStore) {
    keysDataStoreHolder.setDataStore(dataStore);
}.bind(configServer);

configServer.getKeysDataStore = function (dataStore) {
    return keysDataStoreHolder.getDataStore();
}.bind(configServer);

configServer.setKeyService = function (keyService) {
    keyServiceHolder.setKeyService(keyService);
}.bind(configServer);

configServer.inflatExpressApp = function (app) {
    this._app = app || express();
    app = this._app;

    app.use(bodyParser.json({
        limit: '100mb'
    }));

    app.use(bodyParser.urlencoded({
        limit: '100mb',
        extended: true
    }));

    app.use(bodyParser.text({
        limit: '100mb'
    }));

    app.use(bodyParser.raw({
        limit: '100mb'
    }));

    app.use(function (err, req, res, next) {
        if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
            console.error('Bad JSON');
            res.sendStatus(400);
        } else {
            next();
        }
    });

    const orPermisionFilter = (...orPermissionCheckers) => {
        return async(req, res, next) => {
            let result = false;
            for (let orPermissionChecker of orPermissionCheckers) {
                if (await orPermissionChecker(req)) {
                    result = true;
                    break;
                }
            }

            return Promise.resolve(result ? next() : res.sendStatus(401));
        }
    };

    const adminTokenFilter = (req) => {
        let idKey = req.header('id-key');
        if (idKey === configServer._config['admin-token']) {
            req.user = req.user || {};
            req.user.auth = req.user.auth || {};
            req.user.auth['admin'] = true;
            return true;
        } else {
            return false;
        }
    };

    const workspaceIdTokenFilter = (getValidateWorkspaceIdFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                if (!idKey){
                    return Promise.resolve(false);
                }
                let keyDecoded = jwt.verify(idKey, configServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'workspace' &&
                    (validateWorkspaceId === null || keyDecoded['sub'] === validateWorkspaceId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        if (subject) {
                            req.user = req.user || {};
                            req.user.auth = req.user.auth || {};
                            req.user.auth['workspace'] = req.user.auth['workspace'] || {};
                            req.user.auth['workspace'][subject] = true;
                            return Promise.resolve(true);
                        } else {
                            return Promise.resolve(false);
                        }
                    }
                }
            } catch (e) {
            }
            return Promise.resolve(false);
        };
    };

    const workspaceIdSecretFilter = (getValidateWorkspaceIdFunc, getValidateWorkspaceSecretFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            let validateWorkspaceSecret = getValidateWorkspaceSecretFunc ? await getValidateWorkspaceSecretFunc(req) : null;
            try {
                let workspace = await configDataStoreHolder.getDataStore().getWorkspace(validateWorkspaceId);
                if (workspace && workspace.secret === validateWorkspaceSecret){
                    req.user = req.user || {};
                    req.user.auth = req.user.auth || {};
                    req.user.auth['workspace'] = req.user.auth['workspace'] || {};
                    req.user.auth['workspace'][validateWorkspaceId] = true;
                    return Promise.resolve(true);
                } else {
                    return Promise.resolve(false);
                }
            } catch (e) {
                console.error(e);
            }
            return Promise.resolve(false);
        };
    };

    const appIdTokenFilter = (getValidateAppIdFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                if (!idKey){
                    return Promise.resolve(false);
                }
                let keyDecoded = jwt.verify(idKey, configServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                    (validateAppId === null || keyDecoded['sub'] === validateAppId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        if (subject) {
                            req.user = req.user || {};
                            req.user.auth = req.user.auth || {};
                            req.user.auth['app'] = req.user.auth['app'] || {};
                            req.user.auth['app'][subject] = true;
                            return Promise.resolve(true);
                        } else {
                            return Promise.resolve(false);
                        }
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    };

    const appIdSecretFilter = (getValidateAppIdFunc, getValidateAppSecretFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            let validateAppSecret = getValidateAppSecretFunc ? await getValidateAppSecretFunc(req) : null;
            try {
                let app = await configDataStoreHolder.getDataStore().getApp(validateAppId);
                if (app && app.secret === validateAppSecret){
                    req.user = req.user || {};
                    req.user.auth = req.user.auth || {};
                    req.user.auth['app'] = req.user.auth['app'] || {};
                    req.user.auth['app'][validateAppId] = true;
                    return Promise.resolve(true);
                } else {
                    return Promise.resolve(false);
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    };

    app.get('/config/exportWithSecret', orPermisionFilter(
        adminTokenFilter,
    ), configIOController.getConfigExportWithSecret);

    app.get('/config/export', orPermisionFilter(
        adminTokenFilter,
    ), configIOController.getConfigExport);

    app.get('/config/export/workspaces/:workspaceId', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter((req) => req.params.workspaceId)
    ), configIOController.getWorkspaceConfigExport);

    app.post('/config/import', orPermisionFilter(adminTokenFilter), configIOController.importConfig);

    app.get('/config/workspaces/:workspaceId/apps/:appId/open-api-specs',
        orPermisionFilter(
            adminTokenFilter,
            workspaceIdTokenFilter((req) => req.params.workspaceId),
            appIdTokenFilter((req) => req.params.appId)
        ), appController.getOpenApiSpec);

    app.post('/config/workspaces/:workspaceId/apps/:appId/open-api-specs', orPermisionFilter(adminTokenFilter), appController.saveOpenApiSpec);

    app.delete('/config/workspaces/:workspaceId/apps/:appId/open-api-specs', orPermisionFilter(adminTokenFilter), appController.deleteOpenApiSpec);

    app.post('/config/workspaces', orPermisionFilter(adminTokenFilter), workspaceController.createWorkspace);

    app.get('/config/workspaces/:workspaceId', orPermisionFilter(adminTokenFilter), workspaceController.getWorkspace);

    app.post('/config/workspaces/:workspaceId', orPermisionFilter(adminTokenFilter), workspaceController.updateWorkspace);

    app.delete('/config/workspaces/:workspaceId', orPermisionFilter(adminTokenFilter), workspaceController.deleteWorkspace);

    app.post('/config/workspaces/:workspaceId/apps', orPermisionFilter(adminTokenFilter), appController.createApp);

    app.get('/config/workspaces/:workspaceId/apps/:appId', orPermisionFilter(adminTokenFilter), appController.getApp);

    app.post('/config/workspaces/:workspaceId/apps/:appId', orPermisionFilter(adminTokenFilter), appController.updateApp);

    app.delete('/config/workspaces/:workspaceId/apps/:appId', orPermisionFilter(adminTokenFilter), appController.deleteApp);

    app.post('/config/workspaces/:workspaceId/clients', orPermisionFilter(adminTokenFilter), clientController.createClient);

    app.get('/config/workspaces/:workspaceId/clients/:clientId', orPermisionFilter(adminTokenFilter), clientController.getClient);

    app.post('/config/workspaces/:workspaceId/clients/:clientId', orPermisionFilter(adminTokenFilter), clientController.updateClient);

    app.delete('/config/workspaces/:workspaceId/clients/:clientId', orPermisionFilter(adminTokenFilter), clientController.deleteClient);

    app.post('/keys/workspaces/:workspaceId/id-keys',
        orPermisionFilter(
            adminTokenFilter,
            workspaceIdSecretFilter((req) => req.params.workspaceId, (req) => req.body.secret)
        ), (req, res) => {
            return keysController.generateWorkspaceIdKey(configServer._privateKey, configServer._publicKey, req, res);
        });

    app.post('/keys/workspaces/:workspaceId/apps/:appId/id-keys',
        orPermisionFilter(
            adminTokenFilter,
            workspaceIdTokenFilter((req) => req.params.workspaceId),
            appIdSecretFilter((req) => req.params.appId, (req) => req.body.secret)
        ), (req, res) => {
            return keysController.generateAppIdKey(configServer._privateKey, configServer._publicKey, req, res);
        });

    app.post('/keys/id-keys/verification', (req, res) => {
        return keysController.verifyIdKey(configServer._publicKey, req, res);
    });

    app.post('/keys/workspaces/:workspaceId/apps/:appId/api-keys',
        orPermisionFilter(
            adminTokenFilter,
            workspaceIdTokenFilter((req) => req.params.workspaceId),
            appIdTokenFilter((req) => req.params.appId)
        ),
        (req, res) => {
            return keysController.generateApiKey(configServer._privateKey, configServer._publicKey, req, res);
        });

    app.post('/keys/api-keys/verification', (req, res) => {
        return keysController.verifyApiKey(configServer._publicKey, req, res);
    });

}.bind(configServer);

configServer.run = async function (port) {
    let self = this;
    if (!self._app) {
        self.inflatExpressApp();
    }

    port = port || self._config['port'] || 3001

    var privateKeyPath = path.resolve(self._config['private-key-path']);
    var publicKeyPath = path.resolve(self._config['public-key-path']);

    const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
    self._privateKey = privateKeyContent;
    const publicKeyContent = fs.readFileSync(publicKeyPath, 'utf8');
    self._publicKey = publicKeyContent;

    self._server = http.createServer(self._app);
    self._server.listen(port);
    console.log(`Config server started with port ${port}`);

    self._server = httpShutdown(self._server);
    return Promise.resolve();
}.bind(configServer);

configServer.shutdown = async function (port) {
    let self = this;
    return new Promise((resolve, reject) => {
        self._server.forceShutdown(() => {
            resolve();
        });
    });
}.bind(configServer);

module.exports = configServer;