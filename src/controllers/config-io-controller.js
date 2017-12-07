'use strict';

const dataStoreHolder = require('./../data-store/config-data-store').dataStoreHolder;
const workspaceModel = require('./../models/workspace');
const appModel = require('./../models/app');
const clientModel = require('./../models/client');
const ioService = require('./../services/io-service');


const getConfigExportWithSecret = async function (req, res) {
    try{
        let config = await ioService.exportAllRawContent();
        if (config){
            return res.send(config);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }
    return res.sendStatus(500);
}

const getConfigExport = async function (req, res) {
    try{
        let config = await ioService.exportAllContent();
        if (config){
            return res.send(config);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }
    return res.sendStatus(500);
}

const getWorkspaceConfigExport = async function (req, res) {
    let workspaceId = req.params.workspaceId;
    if (!workspaceId) {
        return res.sendStatus(400);
    }
    
    try{
        let config = await ioService.exportContent(workspaceId);
        if (config){
            return res.send(config);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
    }
    return res.sendStatus(500);
}

const importConfig = async function (req, res) {
    let importContent = req.body;
    let now = Date.now();
    try {
        await ioService.importContent(importContent);
        return res.sendStatus(201);
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

module.exports = {
    getConfigExportWithSecret,
    getConfigExport,
    getWorkspaceConfigExport,
    importConfig
};