'use strict';

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;
const workspaceModel = require('./../models/workspace');
const appModel = require('./../models/app');
const clientModel = require('./../models/client');

async function importContent(importContent){
    let now = Date.now();
    let workspaces = importContent.workspaces;
    for (let [workspaceId, workspaceContent] of Object.entries(workspaces)) {
        let existingWorkspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        if (!existingWorkspace) {
            workspaceContent.workspaceId = workspaceId;
            let workspace = workspaceModel.initObject(workspaceContent);
            workspace.secret = workspace.secret || existingWorkspace && existingWorkspace.secret;
            workspace.createTime = existingWorkspace && existingWorkspace.createTime || workspace.createTime || now;
            workspace.updateTime = now;
            await dataStoreHolder.getDataStore().createWorkspace(workspace);
            console.log(`Imported workspace with ID ${workspaceId}`);
        }       

        let apps = workspaceContent.apps;
        for (let [appId, appContent] of Object.entries(apps)) {
            appContent.appId = appId;
            appContent.workspaceId = workspaceId;

            let existingApp = await dataStoreHolder.getDataStore().getApp(appId);
            if (existingApp) {
                continue;
            }
            let app = appModel.initObject(appContent);
            app.secret = app.secret || existingApp && existingApp.secret;
            app.createTime = existingApp && existingApp.createTime || app.createTime || now;
            app.updateTime = now;
            await dataStoreHolder.getDataStore().createApp(app);
            console.log(`Imported app with ID ${appId}`);
        }

        let clients = workspaceContent.clients;
        for (let [clientId, clientContent] of Object.entries(clients)) {
            clientContent.clientId = clientId;
            clientContent.workspaceId = workspaceId;
            
            let existingClient = await dataStoreHolder.getDataStore().getClient(clientId);
            if (existingClient) {
                continue;
            }
            let client = clientModel.initObject(clientContent);
            client.secret = client.secret || existingClient && existingClient.secret;
            client.createTime = existingClient && existingClient.createTime || client.createTime || now;
            client.updateTime = now;
            await dataStoreHolder.getDataStore().createClient(client);
            console.log(`Imported client with ID ${clientId}`);
        }
    }
    
    return new Promise(resolve=>resolve());
}

async function exportContent(workspaceId){
    let config = null;

    let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
    if (workspace) {
        let apps = await dataStoreHolder.getDataStore().getWorkspaceApps(workspaceId);
        let clients = await dataStoreHolder.getDataStore().getWorkspaceClients(workspaceId);
    
        workspace = JSON.parse(JSON.stringify(workspace));
        delete workspace.secret;
        workspace.apps = {};
        workspace.clients = {};
    
        config = config || {};
        config.workspaces = config.workspaces || {};
        config.workspaces[workspace.workspaceId] = workspace;

        if (apps){
            apps = JSON.parse(JSON.stringify(apps));
            apps.forEach((app) => {
                delete app.secret;
            });
            apps.forEach((app) => {
                workspace.apps[app.appId] = app;
            });
        }
        
        if (clients){
            clients = JSON.parse(JSON.stringify(clients));
            clients.forEach((client) => {
                delete client.secret;
            });
            clients.forEach((client) => {
                workspace.clients[client.clientId] = client;
            });
        }
        
    }
    
    return new Promise(resolve=>resolve(config));
}


async function exportAllRawContent(){
    let config = {
        workspaces: {}
    };

    let workspaces = await dataStoreHolder.getDataStore().getWorkspace();
    for(let workspace of workspaces){
        //let workspace = await dataStoreHolder.getDataStore().getWorkspace(workspaceId);
        let workspaceId = workspace.workspaceId;
        let apps = await dataStoreHolder.getDataStore().getWorkspaceApps(workspaceId);
        let clients = await dataStoreHolder.getDataStore().getWorkspaceClients(workspaceId);
    
        workspace = JSON.parse(JSON.stringify(workspace));
        workspace.apps = {};
        workspace.clients = {};
    
        
        config.workspaces[workspace.workspaceId] = workspace;

        if (apps){
            apps = JSON.parse(JSON.stringify(apps));
            apps.forEach((app) => {
                workspace.apps[app.appId] = app;
            });
        }
        
        if (clients){
            clients = JSON.parse(JSON.stringify(clients));
            clients.forEach((client) => {
                workspace.clients[client.clientId] = client;
            });
        }
    }
    
    return new Promise(resolve=>resolve(config));
}

async function exportAllContent(){
    let config = await exportAllRawContent();
    
    for(let [workspaceId, workspace] of Object.entries(config.workspaces)){
        delete workspace.secret;

        for(let [appId, app] of Object.entries(workspace.apps)){
            delete app.secret;
        }

        for(let [clientId, client] of Object.entries(workspace.clients)){
            delete client.secret;
        }
    }
    
    return Promise.resolve(config);
}

module.exports.importContent = importContent;
module.exports.exportContent = exportContent;
module.exports.exportAllRawContent = exportAllRawContent;
module.exports.exportAllContent = exportAllContent;