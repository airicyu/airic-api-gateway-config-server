'use strict';

const uuidv4 = require('uuid/v4');

const clientModel = require('./../models/client');

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;

function newId() {
    return uuidv4().replace(/\-/g, '');
}

function newSecret() {
    return uuidv4().replace(/\-/g, '');
}

const getClient = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let clientId = req.params.clientId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!clientId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(400);
        }

        let client = await dataStoreHolder.getDataStore().getClient(clientId);
        if (client) {
            return res.send(clientModel.toHal(client));
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const createClient = async(req, res) => {
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
        let clientProps = req.body;
        let client = clientModel.initObject(clientProps);
        client.workspaceId = workspaceId;
        client.clientId = newId();
        client.secret = newSecret();
        client.createTime = now;
        client.updateTime = now;
        
        let result = await dataStoreHolder.getDataStore().createClient(client);
        if (result) {
            res.set('Location', `/config/workspaces/${workspaceId}/clients/${client.clientId}`);
            let createdClient = await dataStoreHolder.getDataStore().getClient(client.clientId);
            return res.status(201).send(clientModel.toHal(createdClient));
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const updateClient = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let clientId = req.params.clientId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!clientId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(404);
        }

        let clientProps = req.body;
        let client = clientModel.initObject(clientProps);
        clientProps.workspaceId = workspaceId;
        client.clientId = clientId;

        let oldClient = await dataStoreHolder.getDataStore().getClient(client.clientId);
        if (oldClient){
            if (!client.secret){
                client.secret = oldClient.secret;
            }
            client.createTime = oldClient.createTime;
            client.UpdateTime = Date.now();
            let isUpdated = await dataStoreHolder.getDataStore().updateClient(client);
        }
        
        return res.sendStatus(204);
    } catch (error) {
        console.error(error);
    }

    res.sendStatus(500);
}

const deleteClient = async(req, res) => {
    let workspaceId = req.params.workspaceId;
    let clientId = req.params.clientId;
    if (!workspaceId) {
        return res.sendStatus(400);
    } else if (!clientId) {
        return res.sendStatus(400);
    }

    try {
        let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!workspace) {
            return res.sendStatus(400);
        }

        let client = await dataStoreHolder.getDataStore().getClient(clientId);
        if (client) {
            await dataStoreHolder.getDataStore().deleteClient(clientId);
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
    getClient,
    createClient,
    updateClient,
    deleteClient
};