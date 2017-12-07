'use strict';

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

dataStore.registerDB = function (db) {
    this._db = db;
}.bind(dataStore);

dataStore.getWorkspace = async function (workspaceId) {
    let db = this._db

    if (workspaceId){
        let params = [workspaceId];
        return new Promise((resolve, reject) => {
            db.get('SELECT `workspace` FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                if (row) {
                    return resolve(JSON.parse(row.workspace));
                } else {
                    return resolve(false);
                }
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            db.all('SELECT `workspace` FROM `workspaces_config`', [], function (error, rows) {
                if (error) {
                    return reject(error);
                }
                if (rows) {
                    return resolve(rows.map(_=>JSON.parse(_.workspace)));
                } else {
                    return resolve([]);
                }
            });
        });
    }
    
}

dataStore.createWorkspace = async function (workspace) {
    let db = this._db

    let serializeWorkspace = JSON.stringify(workspace);
    let params = [workspace.workspaceId, serializeWorkspace];
    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `workspaces_config` (`workspaceId`, `workspace`) VALUES (?, ?)', params, function (error) {
            if (error) {
                return reject(error);
            }

            let params = [workspace.workspaceId];
            db.get('SELECT `id` FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                return resolve(row && row.id);
            });
        });
    });
}

dataStore.updateWorkspace = async function (workspace) {
    let db = this._db

    let serializeWorkspace = JSON.stringify(workspace);
    let params = [serializeWorkspace, workspace.workspaceId];
    return new Promise((resolve, reject) => {
        db.run('UPDATE `workspaces_config` set `workspace` = ? where `workspaceId` = ?', params, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteWorkspace = async function (workspaceId) {
    let db = this._db

    let params = [workspaceId]
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error) {
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}

dataStore.getWorkspaceApps = async function (workspaceId) {
    let db = this._db

    let params = [workspaceId];
    return new Promise((resolve, reject) => {
        db.all('SELECT `app` FROM `apps_config` WHERE `workspaceId` = ?', params, function (error, rows) {
            if (error) {
                return reject(error);
            }
            if (rows && rows.length > 0) {
                return resolve(rows.map(_ => JSON.parse(_.app)));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.getWorkspaceClients = async function (workspaceId) {
    let db = this._db

    let params = [workspaceId];
    return new Promise((resolve, reject) => {
        db.all('SELECT `client` FROM `clients_config` WHERE `workspaceId` = ?', params, function (error, rows) {
            if (error) {
                return reject(error);
            }
            if (rows && rows.length > 0) {
                return resolve(rows.map(_ => JSON.parse(_.client)));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.getApp = async function (appId) {
    let db = this._db

    let params = [appId];
    return new Promise((resolve, reject) => {
        db.get('SELECT `app` FROM `apps_config` WHERE `appId` = ?', params, function (error, row) {
            if (error) {
                return reject(error);
            }
            if (row) {
                return resolve(JSON.parse(row.app));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.createApp = async function (app) {
    let db = this._db

    let serializeApp = JSON.stringify(app);
    let params = [app.workspaceId, app.appId, serializeApp];
    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `apps_config` (`workspaceId`, `appId`, `app`) VALUES (?, ?, ?)', params, function (error) {
            if (error) {
                return reject(error);
            }

            let params = [app.appId];
            db.get('SELECT `id` FROM `apps_config` WHERE `appId` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                return resolve(row && row.id);
            });
        });
    });
}

dataStore.updateApp = async function (app) {
    let db = this._db

    let serializeApp = JSON.stringify(app);
    let params = [serializeApp, app.appId];
    return new Promise((resolve, reject) => {
        db.run('UPDATE `apps_config` set `app` = ? where `appId` = ?', params, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteApp = async function (appId) {
    let db = this._db

    let params = [appId]
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `apps_config` WHERE `appId` = ?', params, function (error) {
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}

dataStore.getClient = async function (clientId) {
    let db = this._db

    let params = [clientId];
    return new Promise((resolve, reject) => {
        db.get('SELECT `client` FROM `clients_config` WHERE `clientId` = ?', params, function (error, row) {
            if (error) {
                return reject(error);
            }
            if (row) {
                return resolve(JSON.parse(row.client));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.createClient = async function (client) {
    let db = this._db

    let serializeClient = JSON.stringify(client);
    let params = [client.workspaceId, client.clientId, serializeClient];
    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `clients_config` (`workspaceId`, `clientId`, `client`) VALUES (?, ?, ?)', params, function (error) {
            if (error) {
                return reject(error);
            }

            let params = [client.clientId];
            db.get('SELECT `id` FROM `clients_config` WHERE `clientId` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                return resolve(row && row.id);
            });
        });
    });
}

dataStore.updateClient = async function (client) {
    let db = this._db

    let serializeClient = JSON.stringify(client);
    let params = [serializeClient, client.clientId];
    return new Promise((resolve, reject) => {
        db.run('UPDATE `clients_config` set `client` = ? where `clientId` = ?', params, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteClient = async function (clientId) {
    let db = this._db

    let params = [clientId]
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `clients_config` WHERE `clientId` = ?', params, function (error) {
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}

dataStore.getOpenAPISpec = async function (id) {
    let db = this._db

    let params = [id];
    return new Promise((resolve, reject) => {
        db.get('SELECT `appId`, `openAPISpec`, `lastUpdateTime` FROM `api_spec` WHERE `appId` = ?', params, function (error, row) {
            if (error) {
                return reject(error);
            }
            if (row) {
                return resolve({
                    id: row.appId,
                    openAPISpec: row.openAPISpec,
                    lastUpdateTime: row.lastUpdateTime
                });
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.saveOpenAPISpec = async function (apiSpecModel) {
    let db = this._db

    let params = [apiSpecModel.id, apiSpecModel.openAPISpec, apiSpecModel.lastUpdateTime];
    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `api_spec` (`appId`, `openAPISpec`, `lastUpdateTime`) VALUES (?, ?, ?)', params, function (error) {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteOpenAPISpec = async function (id) {
    let db = this._db

    let params = [id];
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `api_spec` WHERE `appId` = ?', params, function (error) {
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}

module.exports.dataStore = dataStore;