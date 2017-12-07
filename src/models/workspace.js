'use strict';

const workspaceModel = {
    initObject(props) {
        let workspace = {};
        workspace.workspaceId = props.workspaceId;
        workspace.secret = props.secret;
        workspace.displayName = props.displayName;
        workspace.createTime = props.createTime;
        workspace.updateTime = props.updateTime;
        return workspace;
    },
    toHal(workspace) {
        return {
            workspaceId: workspace.workspaceId,
            secret: workspace.secret,
            displayName: workspace.displayName,
            createTime: workspace.createTime,
            updateTime: workspace.updateTime,
            _links: {
                self: {
                    href: `/config/workspaces/${workspace.workspaceId}`
                },
                apps: {
                    href: `/config/workspaces/${workspace.workspaceId}/apps`
                },
                clients: {
                    href: `/config/workspaces/${workspace.workspaceId}/clients`
                }
            },
        }
    }
}

module.exports = workspaceModel;