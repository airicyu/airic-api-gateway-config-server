DROP SCHEMA IF EXISTS `api_config`;
CREATE SCHEMA `api_config`;
USE `api_config`;

DROP TABLE IF EXISTS `workspaces_config`;
CREATE TABLE `workspaces_config` (
    `id` int NOT NULL AUTO_INCREMENT,
    `workspaceId` VARCHAR(36) NOT NULL,
    `workspace` JSON NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `workspaces_config_workspaceid_index` (`workspaceId`)
);

DROP TABLE IF EXISTS `apps_config`;
CREATE TABLE `apps_config` (
    `id` int NOT NULL AUTO_INCREMENT,
    `workspaceId` VARCHAR(36) NOT NULL,
    `appId` VARCHAR(36) NOT NULL,
    `app` JSON NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `apps_config_appid_index` (`appId`),
    INDEX `apps_config_workspaceid_index` (`workspaceId`)
);

DROP TABLE IF EXISTS `clients_config`;
CREATE TABLE `clients_config` (
    `id` int NOT NULL AUTO_INCREMENT,
    `workspaceId` VARCHAR(36) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `client` JSON NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `clients_config_clientid_index` (`clientId`),
    INDEX `clients_config_workspaceid_index` (`workspaceId`)
);

DROP TABLE IF EXISTS `api_spec`;
CREATE TABLE `api_spec` (
    `id` int NOT NULL AUTO_INCREMENT,
    `appId` VARCHAR(36) NOT NULL,
    `openAPISpec` MEDIUMTEXT,
    `lastUpdateTime` INT(13),
    PRIMARY KEY (`id`),
    UNIQUE KEY `api_spec_appid_index` (`appId`)
);