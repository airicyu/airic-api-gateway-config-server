'use strict';

const WORKSPACES = 'workspaces';
const APPS = 'apps';
const CLIENTS = 'clients';
const OPEN_API_SPECS = 'api_specs';

const dataStore = {
    _db: null,

    registerDB: null,

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

const workspaceDBModel = {
    toDbModel(workspace) {
        let dbWorkspace = {};
        dbWorkspace._id = workspace.workspaceId;
        dbWorkspace.secret = workspace.secret;
        dbWorkspace.displayName = workspace.displayName;
        dbWorkspace.createTime = workspace.createTime;
        dbWorkspace.updateTime = workspace.updateTime;
        return dbWorkspace;
    },
    fromDbModel(dbWorkspace) {
        let workspace = {};
        workspace.workspaceId = dbWorkspace._id;
        workspace.secret = dbWorkspace.secret;
        workspace.displayName = dbWorkspace.displayName;
        workspace.createTime = dbWorkspace.createTime;
        workspace.updateTime = dbWorkspace.updateTime;
        return workspace;
    }
}

const appDBModel = {
    toDbModel(app) {
        let dbApp = {};
        dbApp._id = app.appId;
        dbApp.secret = app.secret;
        dbApp.workspaceId = app.workspaceId;
        dbApp.displayName = app.displayName;
        dbApp.openAPISpecLastUpdateTime = app.openAPISpecLastUpdateTime;
        dbApp.quotaRule = JSON.parse(JSON.stringify(app.quotaRule));
        dbApp.createTime = app.createTime;
        dbApp.updateTime = app.updateTime;
        return dbApp;
    },
    fromDbModel(dbApp) {
        let app = {};
        app.appId = dbApp._id;
        app.secret = dbApp.secret;
        app.workspaceId = dbApp.workspaceId;
        app.displayName = dbApp.displayName;
        app.openAPISpecLastUpdateTime = dbApp.openAPISpecLastUpdateTime;
        app.quotaRule = JSON.parse(JSON.stringify(dbApp.quotaRule));
        app.createTime = dbApp.createTime;
        app.updateTime = dbApp.updateTime;
        return app;
    }
}

const clientDBModel = {
    toDbModel(client) {
        let dbClient = {};
        dbClient._id = client.clientId;
        dbClient.secret = client.secret;
        dbClient.workspaceId = client.workspaceId;
        dbClient.displayName = client.displayName;
        dbClient.plans = JSON.parse(JSON.stringify(client.plans));
        dbClient.createTime = client.createTime;
        dbClient.updateTime = client.updateTime;
        return dbClient;
    },
    fromDbModel(dbClient) {
        let client = {};
        client.clientId = dbClient._id;
        client.secret = dbClient.secret;
        client.workspaceId = dbClient.workspaceId;
        client.displayName = dbClient.displayName;
        client.quotaRule = JSON.parse(JSON.stringify(dbClient.plans));
        client.createTime = dbClient.createTime;
        client.updateTime = dbClient.updateTime;
        return client;
    }
}

const apiSpecDBModel = {
    toDbModel(apiSpecModel) {
        let dbModel = {};
        dbModel._id = apiSpecModel.id;
        dbModel.openAPISpec = apiSpecModel.openAPISpec;
        dbModel.lastUpdateTime = apiSpecModel.lastUpdateTime;
        return dbModel;
    },
    fromDbModel(dbModel) {
        let apiSpecModel = {
            id: dbModel._id,
            openAPISpec: dbModel.openAPISpec,
            lastUpdateTime: dbModel.lastUpdateTime
        }
        return apiSpecModel;
    }
}

dataStore.registerDB = function (db) {
    this._db = db;
}.bind(dataStore);

dataStore.getWorkspace = async function (workspaceId) {
    if (workspaceId){
        return new Promise((resolve, reject) => {
            this._db.collection(WORKSPACES).findOne({ _id: workspaceId }, (err, dbWorkspace) => {
                if (err) {
                    reject(err);
                } else if (dbWorkspace) {
                    resolve(workspaceDBModel.fromDbModel(dbWorkspace));
                } else {
                    resolve(null);
                }
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            this._db.collection(WORKSPACES).find({}).toArray((err, workspaces) => {
                if (err) {
                    reject(err);
                } else if (workspaces){
                    resolve(workspaces.map(workspaceDBModel.fromDbModel));
                } else {
                    resolve([]);
                }
            });
        });
    }
}

dataStore.createWorkspace = async function (workspace) {
    let dbWorkspace = workspaceDBModel.toDbModel(workspace);
    return new Promise((resolve, reject) => {
        this._db.collection(WORKSPACES).insertOne(dbWorkspace, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result && result.ops && result.ops[0] && result.ops[0]._id);
            }
        });
    });
}

dataStore.updateWorkspace = async function (workspace) {
    let dbWorkspace = workspaceDBModel.toDbModel(workspace);
    return new Promise((resolve, reject) => {
        this._db.collection(WORKSPACES).findOneAndReplace({ _id: workspace.workspaceId }, dbWorkspace, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.deleteWorkspace = async function (workspaceId) {
    let dbWorkspace = workspaceDBModel.toDbModel(workspace);
    return new Promise((resolve, reject) => {
        this._db.collection(WORKSPACES).findOneAndDelete({ _id: workspace.workspaceId }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.getWorkspaceApps = async function (workspaceId) {
    return new Promise((resolve, reject) => {
        this._db.collection(APPS).find({ workspaceId: workspaceId }).toArray((err, dbApps) => {
            if (err) {
                reject(err);
            } else {
                resolve(dbApps.map(appDBModel.fromDbModel));
            }
        });
    });
}

dataStore.getWorkspaceClients = async function (workspaceId) {
    return new Promise((resolve, reject) => {
        this._db.collection(CLIENTS).find({ workspaceId: workspaceId }).toArray((err, dbClients) => {
            if (err) {
                reject(err);
            } else {
                resolve(dbClients.map(clientDBModel.fromDbModel));
            }
        });
    });
}

dataStore.getApp = async function (appId) {
    return new Promise((resolve, reject) => {
        this._db.collection(APPS).findOne({ _id: appId }, (err, dbApp) => {
            if (err) {
                reject(err);
            } else if (dbApp) {
                resolve(appDBModel.fromDbModel(dbApp));
            } else {
                resolve(null);
            }
        });
    });
}

dataStore.createApp = async function (app) {
    let dbApp = appDBModel.toDbModel(app);
    return new Promise((resolve, reject) => {
        this._db.collection(APPS).insertOne(dbApp, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result && result.ops && result.ops[0] && result.ops[0]._id);
            }
        });
    });
}

dataStore.updateApp = async function (app) {
    let dbApp = appDBModel.toDbModel(app);
    return new Promise((resolve, reject) => {
        this._db.collection(APPS).findOneAndReplace({ _id: app.appId }, dbApp, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.deleteApp = async function (appId) {
    return new Promise((resolve, reject) => {
        this._db.collection(APPS).findOneAndDelete({ _id: appId }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.getClient = async function (clientId) {
    return new Promise((resolve, reject) => {
        this._db.collection(CLIENTS).findOne({ _id: clientId }, (err, dbClient) => {
            if (err) {
                reject(err);
            } else if (dbClient) {
                resolve(clientDBModel.fromDbModel(dbClient));
            } else {
                resolve(null);
            }
        });
    });
}

dataStore.createClient = async function (client) {
    let dbClient = clientDBModel.toDbModel(client);
    return new Promise((resolve, reject) => {
        this._db.collection(CLIENTS).insertOne(dbClient, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result && result.ops && result.ops[0] && result.ops[0]._id);
            }
        });
    });
}

dataStore.updateClient = async function (client) {
    let dbClient = clientDBModel.toDbModel(client);
    return new Promise((resolve, reject) => {
        this._db.collection(CLIENTS).findOneAndReplace({ _id: client.clientId }, dbClient, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.deleteClient = async function (clientId) {
    return new Promise((resolve, reject) => {
        this._db.collection(CLIENTS).findOneAndDelete({ _id: clientId }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

dataStore.getOpenAPISpec = async function (id) {
    return new Promise((resolve, reject) => {
        this._db.collection(OPEN_API_SPECS).findOne({ _id: id }, (err, dbModel) => {
            if (err) {
                reject(err);
            } else if (dbModel){
                let record = apiSpecDBModel.fromDbModel(dbModel);
                resolve(record);
            } else {
                resolve(null);
            }
        });
    });
}

dataStore.saveOpenAPISpec = async function (apiSpecModel) {
    let dbModel = apiSpecDBModel.toDbModel(apiSpecModel);
    return new Promise((resolve, reject) => {
        this._db.collection(OPEN_API_SPECS).findOneAndReplace({ _id: apiSpecModel.id }, dbModel, {
            upsert: true
        }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}
dataStore.deleteOpenAPISpec = async function (id) {
    return new Promise((resolve, reject) => {
        this._db.collection(OPEN_API_SPECS).findOneAndDelete({ _id: id }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

module.exports.dataStore = dataStore;