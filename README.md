# airic-api-gateway-config-server

[![npm version](https://img.shields.io/npm/v/airic-api-gateway-config-server.svg)](https://www.npmjs.com/package/airic-api-gateway-config-server)
[![node](https://img.shields.io/node/v/airic-api-gateway-config-server.svg)](https://www.npmjs.com/package/airic-api-gateway-config-server)
[![Codecov branch](https://img.shields.io/codecov/c/github/airicyu/airic-api-gateway-config-server/master.svg)](https://codecov.io/gh/airicyu/airic-api-gateway-config-server)
[![Build](https://travis-ci.org/airicyu/airic-api-gateway-config-server.svg?branch=master)](https://travis-ci.org/airicyu/airic-api-gateway-config-server)

[![dependencies Status](https://david-dm.org/airicyu/airic-api-gateway-config-server/status.svg)](https://david-dm.org/airicyu/airic-api-gateway-config-server)
[![devDependencies Status](https://david-dm.org/airicyu/airic-api-gateway-config-server/dev-status.svg)](https://david-dm.org/airicyu/airic-api-gateway-config-server?type=dev)

## Description

airic-api-gateway-config-server module is the config server component of airic-api-gateway.

------------------------

## Samples

### Hello world

Starting server:

```javascript
'use strict';
const YAML = require('yamljs');
const configServer = require('airic-api-gateway-config-server');

const configServerConfigYaml = YAML.load('./config-server-config.yaml');

configServer.setConfig(configServerConfigYaml)
configServer.run();
```

------------------------

## Config Server Config YAML

Sample:
```yaml
port: 3001
admin-token: d8745e9d03be41ad817a47176ade4dcc
private-key-path : './system-key-dir/private-key.pem'
public-key-path : './system-key-dir/public-key.pem'
```


------------------------

## REST APIs

### Export all workspaces config
```
GET http://localhost:3001/config/export
id-key: {{adminToken}}
```

### Export all workspaces config (With secrets)
```
GET http://localhost:3001/config/exportWithSecret
id-key: {{adminToken}}
```

### Export specific workspace config
```
GET http://localhost:3001/config/export/workspaces/{{workspaceId}}
id-key: {{adminToken}}
```

### Import Workspaces config
```
POST http://localhost:3001/config/import
Content-type: application/json
id-key: {{adminToken}}

{
    "workspaces": {
        "6ba955dde3044b6687af7b4d05a64920": {
            "secret": "c376f991c6744cfea1ccdad23356ab10",
            "displayName": "Demo Workspace",
            "apps": {
                "b84cdbefe8ab42d38df0aa415030c4a1": {
                    "secret": "fd39eb34e94d41008cc0e196fdc5fc17",
                    "displayName": "Petstore",
                    "openAPISpecLastUpdateTime": 0,
                    "quotaRule": {
                        "plan a": {
                            "app": [{
                                "quota": 1000,
                                "bucket": "5m"
                            }],
                            "tag": {
                                "store": [{
                                    "quota": 500,
                                    "bucket": "5m"
                                }]
                            },
                            "operation": {
                                "placeOrder": [{
                                    "quota": 500,
                                    "bucket": "5m"
                                }]
                            }
                        }
                    }
                }
            },
            "clients": {
                "4364938982b54da1807c599a955cdfcc": {
                    "secret": "4af18e30-85b6-4c14-aecd-c489d404a179",
                    "displayName": "Client A",
                    "plans": {
                        "b84cdbefe8ab42d38df0aa415030c4a1": ["plan a"]
                    }
                }
            }
        }
    }
}
```

### Create Workspace
```
POST http://localhost:3001/config/workspaces
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "Demo Workspace"
}
```

### Get Workspace
```
GET http://localhost:3001/config/workspaces/{{workspaceId}}
id-key: {{adminToken}}
```

### Update Workspace
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "Demo Workspace"
}
```

### Delete Workspace
```
DELETE http://localhost:3001/config/workspaces/{{workspaceId}}
id-key: {{adminToken}}
```

### Create App
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "Petstore"
}
```

### Get App
```
GET http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}
id-key: {{adminToken}}
```

### Update App
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "Petstore"
}
```

### DELETE App
```
DELETE http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}
id-key: {{adminToken}}
```

### Get App Open-API-Spec
```
GET http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/open-api-specs
id-key: {{workspaceIdKey}}
```

### Import App Open-API-Spec
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/open-api-specs
Content-type: text/plain
id-key: {{adminToken}}

swagger: "2.0"
info:
  description: "This is a sample server Petstore server.  You can find out more about     Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).      For this sample, you can use the api key `special-key` to test the authorization     filters."
  version: "1.0.0"
  title: "Swagger Petstore"
  termsOfService: "http://swagger.io/terms/"
  contact:
    email: "apiteam@swagger.io"
  license:
    name: "Apache 2.0"
    url: "http://www.apache.org/licenses/LICENSE-2.0.html"
host: "localhost:8080"
basePath: "/v2"
tags:
- name: "pet"
  description: "Everything about your Pets"
  externalDocs:
    description: "Find out more"
    url: "http://swagger.io"
- name: "store"
  description: "Access to Petstore orders"
- name: "user"
  description: "Operations about user"
  externalDocs:
    description: "Find out more about our store"
    url: "http://swagger.io"
schemes:
- "http"
paths:
  /pet:
    post:
      tags:
      - "pet"
      summary: "Add a new pet to the store"
      description: ""
      operationId: "addPet"
      consumes:
      - "application/json"
      - "application/xml"
      produces:
      - "application/xml"
      - "application/json"
      parameters:
      - in: "body"
        name: "body"
        description: "Pet object that needs to be added to the store"
        required: true
        schema:
          $ref: "#/definitions/Pet"
      responses:
        405:
          description: "Invalid input"
      security:
      - petstore_auth:
        - "write:pets"
        - "read:pets"

......
```

### Create Client
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/clients
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "airic"
}
```

### Get Client
```
GET http://localhost:3001/config/workspaces/{{workspaceId}}/clients/{{clientId}}
id-key: {{adminToken}}
```

### Update Client
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/clients/{{clientId}}
Content-type: application/json
id-key: {{adminToken}}

{
    "displayName": "airic"
}
```

### Delete Client
```
DELETE http://localhost:3001/config/workspaces/{{workspaceId}}/clients/{{clientId}}
id-key: {{adminToken}}
```

### Generate Workspace ID key (with admin token)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

```

### Generate Workspace ID key (with workspace ID/secret)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "workspaceId": "{{workspaceId}}",
    "secret": "{{workspaceSecret}}"
}
```

### Generate App ID key (with admin token)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

```

### Generate App ID key (with workspace ID key)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{workspaceIdKey}}

```

### Generate App ID key (with app ID/secret)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "appId": "{{appId}}",
    "secret": "{{appSecret}}"
}
```

### Verify Workspace ID key or App ID key
```
POST http://localhost:3001/keys/id-keys/verification
Content-type: application/json

{
    "key": "{{workspaceIdKey}}"
}
```

```
POST http://localhost:3001/keys/id-keys/verification
Content-type: application/json

{
    "key": "{{appIdKey}}"
}
```

### Register App API key for Client
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/api-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "clientId": "{{clientId}}"
}
```

### Verify API key
```
POST http://localhost:3001/keys/api-keys/verification
Content-type: application/json

{
    "key": "{{apiKey}}"
}
```