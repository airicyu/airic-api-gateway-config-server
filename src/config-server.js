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
    setConfigDataStore: null,
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

configServer.setKeysDataStore = function (dataStore) {
    keysDataStoreHolder.setDataStore(dataStore);
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
    }

    const adminTokenFilter = (req) => {
        let idKey = req.header('id-key');
        return (idKey === configServer._config['admin-token']);
    }

    const workspaceIdTokenFilter = (getValidateWorkspaceIdFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                let keyDecoded = jwt.verify(idKey, configServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'workspace' &&
                    (validateWorkspaceId === null || keyDecoded['sub'] === validateWorkspaceId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    }

    const appIdTokenFilter = (getValidateAppIdFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                let keyDecoded = jwt.verify(idKey, configServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                    (validateAppId === null || keyDecoded['sub'] === validateAppId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    }

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

    app.post('/keys/id-key', orPermisionFilter(adminTokenFilter), (req, res) => {
        let subjectType = req.body.subjectType;
        if (subjectType === 'workspace') {
            return keysController.generateWorkspaceIdKey(configServer._privateKey, configServer._publicKey, req, res);
        } else if (subjectType === 'app') {
            return keysController.generateAppIdKey(configServer._privateKey, configServer._publicKey, req, res);
        }
    });

    app.post('/keys/id-key/verification', (req, res) => {
        return keysController.verifyIdKey(configServer._publicKey, req, res);
    });

    app.post('/keys/api-key', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter(async(req) => {
            let app = await dataStoreHolder.getDataStore().getApp(req.params.appId);
            if (app) {
                return Promise.resolve(app.workspaceId);
            } else {
                return Promise.resolve(undefined);
            }
        }),
        appIdTokenFilter(async(req) => Promise.resolve(req.params.appId))), (req, res) => {
        return keysController.generateApiKey(configServer._privateKey, configServer._publicKey, req, res);
    });

    app.post('/keys/api-key/verification', (req, res) => {
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