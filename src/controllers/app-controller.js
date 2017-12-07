'use strict';

const uuidv4 = require('uuid/v4');

const appModel = require('./../models/app');

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;

function newId() {
    return uuidv4().replace(/\-/g, '');
}

function newSecret() {
    return uuidv4().replace(/\-/g, '');
}

const getApp = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!appId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(400);
        }

        let app = await dataStoreHolder.getDataStore().getApp(appId);
        if (app) {
            return res.send(appModel.toHal(app));
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const createApp = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    if (!workspaceId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(400);
        }

        let now = Date.now();
        let appProps = req.body;
        let app = appModel.initObject(appProps);
        app.workspaceId = workspaceId;
        app.appId = newId();
        app.secret = newSecret();
        app.createTime = now;
        app.updateTime = now;

        let result = await dataStoreHolder.getDataStore().createApp(app);
        if (result) {
            res.set('Location', `/config/workspaces/${workspaceId}/apps/${app.appId}`);
            let createdApp = await dataStoreHolder.getDataStore().getApp(app.appId);
            return res.status(201).send(appModel.toHal(createdApp));
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const updateApp = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!appId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(404);
        }

        let appProps = req.body;
        let app = appModel.initObject(appProps);
        app.workspaceId = workspaceId;
        app.appId = appId;
        let oldApp = await dataStoreHolder.getDataStore().getApp(app.appId);
        if (oldApp) {
            if (!app.secret) {
                app.secret = oldApp.secret;
            }
            app.createTime = oldApp.createTime;
            app.UpdateTime = Date.now();
            let isUpdated = await dataStoreHolder.getDataStore().updateApp(app);
        }
        
        return res.sendStatus(204);
    } catch (error) {
        console.error(error);
    }

    res.sendStatus(500);
}

const deleteApp = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!appId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(400);
        }

        let app = dataStoreHolder.getDataStore().getApp(appId);
        if (app) {
            let isDeleted = await dataStoreHolder.getDataStore().deleteApp(appId);
            return res.sendStatus(204);
        } else {
            return res.send(410);
        }
    } catch (error) {
        console.error(error);
    }

    return res.send(500);
}

const getOpenApiSpec = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;

    if (!workspaceId || !appId) {
        return res.sendStatus(400);
    }

    try {
        let apiSpecModel = await dataStoreHolder.getDataStore().getOpenAPISpec(appId);
        if (apiSpecModel) {
            return res.send(apiSpecModel.openAPISpec);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const saveOpenApiSpec = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    let openAPISpec = req.body;
    if (typeof openAPISpec !== 'string'){
        openAPISpec = openAPISpec.toString();
    }

    if (!workspaceId || !appId) {
        return res.sendStatus(400);
    }

    try {
        let now = Date.now();
        let apiSpecModel = {
            id: appId,
            openAPISpec: openAPISpec,
            lastUpdateTime: now
        };

        let result = await dataStoreHolder.getDataStore().saveOpenAPISpec(apiSpecModel);
        if (result){
            let app = await dataStoreHolder.getDataStore().getApp(appId);
            app.openAPISpecLastUpdateTime = now;
            await dataStoreHolder.getDataStore().updateApp(app);
            res.set('Location', `/config/workspaces/${workspaceId}/apps/${appId}/open-api-specs`);
            return res.sendStatus(204);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const deleteOpenApiSpec = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;

    if (!workspaceId || !appId) {
        return res.sendStatus(400);
    }

    try {
        let now = Date.now();
        await dataStoreHolder.getDataStore().deleteOpenAPISpec(appId);
        let app = await dataStoreHolder.getDataStore().getApp(appId);
        app.openAPISpecLastUpdateTime = now;
        await dataStoreHolder.getDataStore().updateApp(app);
        return res.sendStatus(204);
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

module.exports = {
    getApp,
    createApp,
    updateApp,
    deleteApp,
    getOpenApiSpec,
    saveOpenApiSpec,
    deleteOpenApiSpec
};