'use strict';

const clientModel = {
    initObject(props){
        let client = {};
        client.clientId = props.clientId;
        client.secret = props.secret;
        client.workspaceId = props.workspaceId;
        client.displayName = props.displayName || client.clientId;
        client.plans = props.plans || {};
        client.createTime = props.createTime;
        client.updateTime = props.updateTime;
        return client;
    },
    toHal(client){
        return {
            clientId: client.clientId,
            secret: client.secret,
            displayName: client.displayName,
            workspaceId: client.workspaceId,
            plans: client.plans,
            createTime: client.createTime,
            updateTime: client.updateTime,
            _links:{
                self:{
                    href: `/config/workspaces/${client.workspace}/clients/${client.clientId}`
                },
                workspace:{
                    href: `/config/workspaces/${client.workspaceId}`
                }
            },
        }
    }
}

module.exports = clientModel;