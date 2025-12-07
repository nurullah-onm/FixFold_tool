-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inbound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "remark" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "listen" TEXT NOT NULL DEFAULT '0.0.0.0',
    "tag" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'TCP',
    "security" TEXT NOT NULL DEFAULT 'NONE',
    "streamSettings" JSONB NOT NULL,
    "tlsSettings" JSONB,
    "realitySettings" JSONB,
    "sniffing" JSONB,
    "allocate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "up" BIGINT NOT NULL DEFAULT 0,
    "down" BIGINT NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inbound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XrayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "log" JSONB NOT NULL,
    "api" JSONB NOT NULL,
    "inbounds" JSONB NOT NULL,
    "outbounds" JSONB NOT NULL,
    "routing" JSONB NOT NULL,
    "dns" JSONB,
    "policy" JSONB,
    "stats" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inboundId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "uuid" TEXT,
    "password" TEXT,
    "flow" TEXT,
    "totalGB" BIGINT NOT NULL DEFAULT 0,
    "expiryTime" DATETIME,
    "limitIp" INTEGER NOT NULL DEFAULT 0,
    "up" BIGINT NOT NULL DEFAULT 0,
    "down" BIGINT NOT NULL DEFAULT 0,
    "enable" BOOLEAN NOT NULL DEFAULT true,
    "tgId" TEXT,
    "subId" TEXT NOT NULL,
    "reset" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_inboundId_fkey" FOREIGN KEY ("inboundId") REFERENCES "Inbound" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrafficSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upRate" REAL NOT NULL,
    "downRate" REAL NOT NULL,
    "totalRate" REAL NOT NULL,
    "connectionCount" INTEGER NOT NULL,
    CONSTRAINT "TrafficSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "Anomaly_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "trainedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accuracy" REAL NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 443,
    "type" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastHeartbeat" DATETIME,
    "version" TEXT,
    "maxClients" INTEGER NOT NULL DEFAULT 1000,
    "currentClients" INTEGER NOT NULL DEFAULT 0,
    "cpuUsage" REAL NOT NULL DEFAULT 0,
    "ramUsage" REAL NOT NULL DEFAULT 0,
    "diskUsage" REAL NOT NULL DEFAULT 0,
    "networkLoad" REAL NOT NULL DEFAULT 0,
    "country" TEXT,
    "city" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "totalUp" BIGINT NOT NULL DEFAULT 0,
    "totalDown" BIGINT NOT NULL DEFAULT 0,
    "lastSyncAt" DATETIME,
    "configVersion" TEXT,
    "responseTime" INTEGER,
    "uptime" INTEGER,
    "tags" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServerInbound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "inboundId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServerInbound_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServerInbound_inboundId_fkey" FOREIGN KEY ("inboundId") REFERENCES "Inbound" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServerClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServerClient_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServerClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Inbound_port_key" ON "Inbound"("port");

-- CreateIndex
CREATE UNIQUE INDEX "Inbound_tag_key" ON "Inbound"("tag");

-- CreateIndex
CREATE INDEX "Inbound_userId_idx" ON "Inbound"("userId");

-- CreateIndex
CREATE INDEX "Inbound_protocol_idx" ON "Inbound"("protocol");

-- CreateIndex
CREATE INDEX "Inbound_port_idx" ON "Inbound"("port");

-- CreateIndex
CREATE UNIQUE INDEX "Client_subId_key" ON "Client"("subId");

-- CreateIndex
CREATE INDEX "Client_inboundId_idx" ON "Client"("inboundId");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_subId_idx" ON "Client"("subId");

-- CreateIndex
CREATE INDEX "Client_expiryTime_idx" ON "Client"("expiryTime");

-- CreateIndex
CREATE UNIQUE INDEX "Client_inboundId_email_key" ON "Client"("inboundId", "email");

-- CreateIndex
CREATE INDEX "TrafficSnapshot_clientId_timestamp_idx" ON "TrafficSnapshot"("clientId", "timestamp");

-- CreateIndex
CREATE INDEX "Anomaly_clientId_detectedAt_idx" ON "Anomaly"("clientId", "detectedAt");

-- CreateIndex
CREATE INDEX "Anomaly_severity_idx" ON "Anomaly"("severity");

-- CreateIndex
CREATE INDEX "Anomaly_resolved_idx" ON "Anomaly"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_name_key" ON "AIModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Server_name_key" ON "Server"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Server_apiKey_key" ON "Server"("apiKey");

-- CreateIndex
CREATE INDEX "Server_type_idx" ON "Server"("type");

-- CreateIndex
CREATE INDEX "Server_status_idx" ON "Server"("status");

-- CreateIndex
CREATE INDEX "Server_lastHeartbeat_idx" ON "Server"("lastHeartbeat");

-- CreateIndex
CREATE INDEX "ServerInbound_serverId_idx" ON "ServerInbound"("serverId");

-- CreateIndex
CREATE INDEX "ServerInbound_inboundId_idx" ON "ServerInbound"("inboundId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerInbound_serverId_inboundId_key" ON "ServerInbound"("serverId", "inboundId");

-- CreateIndex
CREATE INDEX "ServerClient_serverId_idx" ON "ServerClient"("serverId");

-- CreateIndex
CREATE INDEX "ServerClient_clientId_idx" ON "ServerClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerClient_serverId_clientId_key" ON "ServerClient"("serverId", "clientId");
