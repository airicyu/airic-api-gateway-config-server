'use strict';

const openAPIStore = {};
const config = {
    workspaces: {},
    apps: {},
    clients: {}
};

const dataStore = {
    getWorkspace: null,
    createWorkspace: null,
    updateWorkspace: null,
    deleteWorkspace: null,
    getWorkspaceApps: null,
    getWorkspaceClients: null,

    getApp: null,
    createApp: null,
    updateApp: null,
    deleteApp: null,

    getClient: null,
    createClient: null,
    updateClient: null,
    deleteClient: null,

    getOpenAPISpec: null,
    saveOpenAPISpec: null,
    deleteOpenAPISpec: null,
}

dataStore.getWorkspace = async function (workspaceId) {
    if (workspaceId) {
        return new Promise(resolve => resolve(config.workspaces[workspaceId]));
    } else {
        return new Promise(resolve => resolve(Object.values(config.workspaces)));
    }
}

dataStore.createWorkspace = async function (workspace) {
    config.workspaces[workspace.workspaceId] = workspace;
    return new Promise(resolve => resolve(workspace.workspaceId));
}

dataStore.updateWorkspace = async function (workspace) {
    if (workspace.workspaceId && config.workspaces[workspace.workspaceId]) {
        config.workspaces[workspace.workspaceId] = workspace;
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.deleteWorkspace = async function (workspaceId) {
    if (config.workspaces[workspaceId]) {
        delete config.workspaces[workspaceId];
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.getWorkspaceApps = async function (workspaceId) {
    let apps = [];
    for (let [appId, app] of Object.entries(config.apps)) {
        if (app.workspaceId === workspaceId) {
            apps.push(app);
        }
    }
    return new Promise((resolve) => resolve(apps));
}

dataStore.getWorkspaceClients = async function (workspaceId) {
    let clients = [];
    for (let [clientId, client] of Object.entries(config.clients)) {
        if (client.workspaceId === workspaceId) {
            clients.push(client);
        }
    }
    return new Promise((resolve) => resolve(clients));
}

dataStore.getApp = async function (appId) {
    return new Promise((resolve) => resolve(config.apps[appId]));
}

dataStore.createApp = async function (app) {
    config.apps[app.appId] = app;
    return new Promise((resolve) => resolve(app.appId));
}

dataStore.updateApp = async function (app) {
    if (app.appId && config.apps[app.appId]) {
        config.apps[app.appId] = app;
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.deleteApp = async function (appId) {
    if (config.apps[appId]) {
        delete config.apps[appId];
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.getClient = async function (clientId) {
    return new Promise((resolve) => resolve(config.clients[clientId]));
}

dataStore.createClient = async function (client) {
    config.clients[client.clientId] = client;
    return new Promise((resolve) => resolve(client.clientId));
}

dataStore.updateClient = async function (client) {
    if (client.clientId && config.clients[client.clientId]) {
        config.clients[client.clientId] = client;
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.deleteClient = async function (clientId) {
    if (config.clients[clientId]) {
        delete config.clients[clientId];
        return new Promise((resolve) => resolve(true));
    } else {
        return new Promise((resolve) => resolve(false));
    }
}

dataStore.getOpenAPISpec = async function (id) {
    return new Promise((resolve) => resolve(openAPIStore[id]));
}
dataStore.saveOpenAPISpec = async function (apiSpecModel) {
    let id = apiSpecModel.id;
    openAPIStore[id] = apiSpecModel;
    return new Promise((resolve) => resolve(true));
}
dataStore.deleteOpenAPISpec = async function (id) {
    if (openAPIStore[id]) {
        delete openAPIStore[id];
        return new Promise((resolve) => resolve(true));
    }

    return new Promise((resolve) => resolve(false));
}

module.exports.dataStore = dataStore;