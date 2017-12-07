'use strict';

const appModel = {
    initObject(props){
        let app = {};
        app.appId = props.appId;
        app.secret = props.secret;
        app.workspaceId = props.workspaceId;
        app.displayName = props.displayName || app.appId;
        app.openAPISpecLastUpdateTime = props.openAPISpecLastUpdateTime || 0;
        app.quotaRule = props.quotaRule || {};
        app.createTime = props.createTime;
        app.updateTime = props.updateTime;
        return app;
    },
    toHal(app){
        return {
            appId: app.appId,
            secret: app.secret,
            displayName: app.displayName,
            workspaceId: app.workspaceId,
            openAPISpecLastUpdateTime: app.openAPISpecLastUpdateTime,
            quotaRule: app.quotaRule,
            createTime: app.createTime,
            updateTime: app.updateTime,
            _links:{
                self:{
                    href: `/config/workspaces/${app.workspaceId}/apps/${app.appId}`
                },
                workspace:{
                    href: `/config/workspaces/${app.workspaceId}`
                }
            },
        }
    }
}

module.exports = appModel;