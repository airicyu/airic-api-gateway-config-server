'use strict';

const keyServiceHolder = require('./../services/key-service').keyServiceHolder;

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;
const keyDataStoreHolder = require('./../data-store/keys-data-store').dataStoreHolder;

const generateWorkspaceIdKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    }
    
    if (!auth) {
        return res.sendStatus(401);
    }

    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(404);
        }

        let key = keyServiceHolder.getKeyService().generateWorkspaceKey(privateKey, publicKey, workspace, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId,
                subjectType: 'workspace',
                subject: workspaceId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const generateAppIdKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    } else if (reqAuth['app'][appId]){
        auth = true;
    }

    if (!auth) {
        return res.sendStatus(401);
    }

    
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let app = await dataStoreHolder.getDataStore().getApp(appId);
        if (!app || app.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(404);
        }

        let key = keyServiceHolder.getKeyService().generateAppKey(privateKey, publicKey, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId: app.workspaceId,
                subjectType: 'app',
                subject: appId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const verifyIdKey = async(publicKey, req, res) => {
    let idKey = req.body.key;
    if (!idKey) {
        return res.send({
            result: false,
            code: 400,
            message: 'Invalid key'
        });
    }

    try {
        let keyDecoded = keyServiceHolder.getKeyService().verifyIdKey(idKey, publicKey, req);
        if (keyDecoded) {
            let haveKey = await keyDataStoreHolder.getDataStore().checkIdKeyExist({
                key: idKey
            });
            if (haveKey) {
                let header = {};
                try {
                    header = JSON.parse(new Buffer(idKey.split('.')[0], 'base64').toString());
                } catch (e) {}
                return res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                });
            } else {
                return res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                });
            }
        } else {
            return res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            });
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const generateApiKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    let clientId = req.body.clientId;
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    } else if (reqAuth['app'][appId]){
        auth = true;
    }

    if (!auth) {
        return res.sendStatus(401);
    }
    
    try {
        let app = await dataStoreHolder.getDataStore().getApp(appId);
        let client = await dataStoreHolder.getDataStore().getClient(clientId);

        if (!app || app.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(404);
        }

        if (!app || app.workspaceId !== req.params.workspaceId || !client || client.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(400);
        }

        let key = keyServiceHolder.getKeyService().generateClientAppApiKey(privateKey, publicKey, client, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveApiKey({
                key,
                workspaceId: app.workspaceId,
                appId: appId,
                clientId: clientId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const verifyApiKey = async(publicKey, req, res) => {
    let apiKey = req.body.key;
    if (!apiKey) {
        return res.send({
            result: false,
            code: 400,
            message: 'Invalid key'
        });
    }

    try {
        let keyDecoded = keyServiceHolder.getKeyService().verifyApiKey(apiKey, publicKey, req);
        if (keyDecoded) {
            let haveKey = await keyDataStoreHolder.getDataStore().checkApiKeyExist({
                key: apiKey
            });
            if (haveKey) {
                let header = {};
                try {
                    header = JSON.parse(new Buffer(apiKey.split('.')[0], 'base64').toString());
                } catch (e) {}
                return res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                });
            } else {
                return res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                });
            }
        } else {
            return res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            });
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

module.exports = {
    generateWorkspaceIdKey,
    generateAppIdKey,
    generateApiKey,
    verifyIdKey,
    verifyApiKey
};