'use strict';

const dataStore = {
    _pool: null,
    registerConnectionPool: null,
    getConnection: null,

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

dataStore.registerConnectionPool = function (pool) {
    this._pool = pool;
}.bind(dataStore);

dataStore.getConnection = async function () {
    let pool = this._pool;
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                return reject(err);
            } else {
                return resolve(connection);
            }
        });
    });
}.bind(dataStore);

dataStore.getWorkspace = async function (workspaceId) {
    let connection = await this.getConnection();

    if (workspaceId) {
        let params = [workspaceId];
        return new Promise((resolve, reject) => {
            connection.query('SELECT `workspace` FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                if (results && results.length > 0) {
                    return resolve(JSON.parse(results[0].workspace));
                } else {
                    return resolve(false);
                }
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            connection.query('SELECT `workspace` FROM `workspaces_config`', [], function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                if (results && results.length > 0) {
                    return resolve(results.map(_=>JSON.parse(_.workspace)));
                } else {
                    return resolve([]);
                }
            });
        });
    }
}

dataStore.createWorkspace = async function (workspace) {
    let connection = await this.getConnection();

    let serializeWorkspace = JSON.stringify(workspace);
    let params = [workspace.workspaceId, serializeWorkspace, serializeWorkspace];
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO `workspaces_config` (`workspaceId`, `workspace`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `workspace` = ?', params, function (error, results, fields) {
            if (error) {
                connection.release();
                return reject(error);
            }

            let params = [workspace.workspaceId];
            connection.query('SELECT `id` FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                return resolve(results && results[0] && results[0].id);
            });
        });
    });
}

dataStore.updateWorkspace = async function (workspace) {
    let connection = await this.getConnection();

    let serializeWorkspace = JSON.stringify(workspace);
    let params = [serializeWorkspace, workspace.workspaceId];
    return new Promise((resolve, reject) => {
        connection.query('UPDATE `workspaces_config` set `workspace` = ? where `workspaceId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteWorkspace = async function (workspaceId) {
    let connection = await this.getConnection();

    let params = [workspaceId]
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `workspaces_config` WHERE `workspaceId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}

dataStore.getWorkspaceApps = async function (workspaceId) {
    let connection = await this.getConnection();

    let params = [workspaceId];
    return new Promise((resolve, reject) => {
        connection.query('SELECT `app` FROM `apps_config` WHERE `workspaceId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length > 0) {
                return resolve(results.map(_ => JSON.parse(_.app)));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.getWorkspaceClients = async function (workspaceId) {
    let connection = await this.getConnection();

    let params = [workspaceId];
    return new Promise((resolve, reject) => {
        connection.query('SELECT `client` FROM `clients_config` WHERE `workspaceId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length > 0) {
                return resolve(results.map(_ => JSON.parse(_.client)));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.getApp = async function (appId) {
    let connection = await this.getConnection();

    let params = [appId];
    return new Promise((resolve, reject) => {
        connection.query('SELECT `app` FROM `apps_config` WHERE `appId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length > 0) {
                return resolve(JSON.parse(results[0].app));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.createApp = async function (app) {
    let connection = await this.getConnection();

    let serializeApp = JSON.stringify(app);
    let params = [app.workspaceId, app.appId, serializeApp, serializeApp];
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO `apps_config` (`workspaceId`, `appId`, `app`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `app` = ?', params, function (error, results, fields) {
            if (error) {
                connection.release();
                return reject(error);
            }

            let params = [app.appId];
            connection.query('SELECT `id` FROM `apps_config` WHERE `appId` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                return resolve(results && results[0] && results[0].id);
            });
        });
    });
}

dataStore.updateApp = async function (app) {
    let connection = await this.getConnection();

    let serializeApp = JSON.stringify(app);
    let params = [serializeApp, app.appId];
    return new Promise((resolve, reject) => {
        connection.query('UPDATE `apps_config` set `app` = ? where `appId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteApp = async function (appId) {
    let connection = await this.getConnection();

    let params = [appId]
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `apps_config` WHERE `appId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}

dataStore.getClient = async function (clientId) {
    let connection = await this.getConnection();

    let params = [clientId];
    return new Promise((resolve, reject) => {
        connection.query('SELECT `client` FROM `clients_config` WHERE `clientId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length > 0) {
                return resolve(JSON.parse(results[0].client));
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.createClient = async function (client) {
    let connection = await this.getConnection();

    let serializeClient = JSON.stringify(client);
    let params = [client.workspaceId, client.clientId, serializeClient, serializeClient];
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO `clients_config` (`workspaceId`, `clientId`, `client`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `client` = ?', params, function (error, results, fields) {
            if (error) {
                connection.release();
                return reject(error);
            }

            let params = [client.clientId];
            connection.query('SELECT `id` FROM `clients_config` WHERE `clientId` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                return resolve(results && results[0] && results[0].id);
            });
        });
    });
}

dataStore.updateClient = async function (client) {
    let connection = await this.getConnection();

    let serializeClient = JSON.stringify(client);
    let params = [serializeClient, client.clientId];
    return new Promise((resolve, reject) => {
        connection.query('UPDATE `clients_config` set `client` = ? where `clientId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteClient = async function (clientId) {
    let connection = await this.getConnection();

    let params = [clientId]
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `clients_config` WHERE `clientId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}

dataStore.getOpenAPISpec = async function (id) {
    let connection = await this.getConnection();

    let params = [id];
    return new Promise((resolve, reject) => {
        connection.query('SELECT `appId`, `openAPISpec`, `lastUpdateTime` FROM `api_spec` WHERE `appId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length > 0) {
                return resolve({
                    id: results[0].appId,
                    openAPISpec: results[0].openAPISpec,
                    lastUpdateTime: results[0].lastUpdateTime
                });
            } else {
                return resolve(false);
            }
        });
    });
}

dataStore.saveOpenAPISpec = async function (apiSpecModel) {
    let connection = await this.getConnection();

    let params = [apiSpecModel.id, apiSpecModel.openAPISpec, apiSpecModel.lastUpdateTime, apiSpecModel.openAPISpec, apiSpecModel.lastUpdateTime];
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO `api_spec` (`appId`, `openAPISpec`, `lastUpdateTime`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `openAPISpec` = ?, lastUpdateTime = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

dataStore.deleteOpenAPISpec = async function (id) {
    let connection = await this.getConnection();

    let params = [id];
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `api_spec` WHERE `appId` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}

module.exports.dataStore = dataStore;