'use strict';

const uuidv4 = require('uuid/v4');

const workspaceModel = require('./../models/workspace');

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;

function newId() {
    return uuidv4().replace(/\-/g, '');
}

function newSecret() {
    return uuidv4().replace(/\-/g, '');
}

const getWorkspace = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    if (!workspaceId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (workspace) {
            return res.send(workspaceModel.toHal(workspace));
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const createWorkspace = async (req, res) => {
    let workspaceProps = req.body;
    let workspace = workspaceModel.initObject(workspaceProps);

    try {
        let now = Date.now();
        workspace.workspaceId = newId();
        workspace.secret = newSecret();
        workspace.createTime = now;
        workspace.updateTime = now;
        let result = await dataStoreHolder.getDataStore().createWorkspace(workspace);
        if (result) {
            res.set('Location', `/config/workspaces/${workspace.workspaceId}`);
            let createdWorkspace = await dataStoreHolder.getDataStore().getWorkspace(workspace.workspaceId);
            return res.status(201).send(workspaceModel.toHal(createdWorkspace));
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const updateWorkspace = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let workspaceProps = req.body;
    let workspace = workspaceModel.initObject(workspaceProps);
    workspace.workspaceId = workspaceId;
    
    try {
        let oldWorkspace = await dataStoreHolder.getDataStore().getWorkspace(workspace.workspaceId);
        if (oldWorkspace){
            if (!workspace.secret){
                workspace.secret = oldWorkspace.secret;
            }
            workspace.createTime = oldWorkspace.createTime;
            workspace.UpdateTime = Date.now();
            let isUpdated = await dataStoreHolder.getDataStore().updateWorkspace(workspace);
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error(error);
    }

    res.sendStatus(500);
}

const deleteWorkspace = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    if (!workspaceId) {
        return res.sendStatus(400);
    }
    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (workspace) {
            let workspaceApps = await dataStoreHolder.getDataStore().getWorkspaceApps(workspaceId);
            let workspaceClients = await dataStoreHolder.getDataStore().getWorkspaceClients(workspaceId);
            for(let client of workspaceClients){
                await dataStoreHolder.getDataStore().deleteClient(client.clientId);
            }
            for(let app of workspaceApps){
                await dataStoreHolder.getDataStore().deleteApp(app.appId);
            }
            let isDeleted = await dataStoreHolder.getDataStore().deleteWorkspace(workspaceId);
            return res.sendStatus(204);
        } else {
            return res.send(410);
        }
    } catch (error) {
        console.error(error);
    }

    res.sendStatus(500);
}

module.exports = {
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
};