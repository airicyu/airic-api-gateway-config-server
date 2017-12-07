'use strict';

const keyServiceHolder = require('./../services/key-service').keyServiceHolder;

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;
const keyDataStoreHolder = require('./../data-store/keys-data-store').dataStoreHolder;

const generateWorkspaceIdKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.body.workspaceId;
    let workspaceSecret = req.body.secret;
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
            return Promise.resolve(res.sendStatus(400));
        }
        if (workspace.secret !== workspaceSecret) {
            return Promise.resolve(res.sendStatus(401));
        }

        let key = keyServiceHolder.getKeyService().generateWorkspaceKey(privateKey, publicKey, workspace, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId,
                subjectType: 'workspace',
                subject: workspaceId
            })) {
            return Promise.resolve(res.send(key));
        }
    } catch (error) {
        console.error(error);
    }

    return Promise.resolve(res.sendStatus(500));
}

const generateAppIdKey = async(privateKey, publicKey, req, res) => {
    let appId = req.body.appId;
    let appSecret = req.body.secret;
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let app = await dataStoreHolder.getDataStore().getApp(appId);
        if (!app) {
            return Promise.resolve(res.sendStatus(400));
        }
        if (app.secret !== appSecret) {
            return Promise.resolve(res.sendStatus(401));
        }

        let key = keyServiceHolder.getKeyService().generateAppKey(privateKey, publicKey, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId: app.workspaceId,
                subjectType: 'app',
                subject: appId
            })) {
            return Promise.resolve(res.send(key));
        }
    } catch (error) {
        console.error(error);
    }

    return Promise.resolve(res.sendStatus(500));
}

const verifyIdKey = async(publicKey, req, res) => {
    let idKey = req.body.key;
    if (!idKey) {
        return Promise.resolve(res.send({
            result: false,
            code: 400,
            message: 'Invalid key'
        }));
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
                return Promise.resolve(res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                }));
            } else {
                return Promise.resolve(res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                }));
            }
        } else {
            return Promise.resolve(res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            }));
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const generateApiKey = async(privateKey, publicKey, req, res) => {
    let appId = req.body.appId;
    let appSecret = req.body.secret;
    let clientId = req.body.clientId;
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let app = await dataStoreHolder.getDataStore().getApp(appId);
        let client = await dataStoreHolder.getDataStore().getClient(clientId);
        if (!app || !client || app.workspaceId !== client.workspaceId) {
            return Promise.resolve(res.sendStatus(400));
        }
        if (app.secret !== appSecret) {
            return Promise.resolve(res.sendStatus(401));
        }

        let key = keyServiceHolder.getKeyService().generateClientAppApiKey(privateKey, publicKey, client, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveApiKey({
                key,
                workspaceId: app.workspaceId,
                appId: appId,
                clientId: clientId
            })) {
            return Promise.resolve(res.send(key));
        }
    } catch (error) {
        console.error(error);
    }

    return Promise.resolve(res.sendStatus(500));
}

const verifyApiKey = async(publicKey, req, res) => {
    let apiKey = req.body.key;
    if (!apiKey) {
        return Promise.resolve(res.send({
            result: false,
            code: 400,
            message: 'Invalid key'
        }));
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
                return Promise.resolve(res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                }));
            } else {
                return Promise.resolve(res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                }));
            }
        } else {
            return Promise.resolve(res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            }));
        }
    } catch (error) {
        console.error(error);
    }

    return Promise.resolve(res.sendStatus(500));
}

module.exports = {
    generateWorkspaceIdKey,
    generateAppIdKey,
    generateApiKey,
    verifyIdKey,
    verifyApiKey
};