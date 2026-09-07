"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let StorageService = class StorageService {
    constructor(config) {
        this.config = config;
        this.root = (0, path_1.resolve)(this.config.get('STORAGE_ROOT', './storage'));
    }
    async save(buffer, originalFilename) {
        const checksumSha256 = (0, crypto_1.createHash)('sha256').update(buffer).digest('hex');
        const key = `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(originalFilename) || ''}`;
        const shard = key.slice(0, 2);
        const dir = (0, path_1.join)(this.root, shard);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(dir, key), buffer);
        return { storageKey: `${shard}/${key}`, sizeBytes: buffer.length, checksumSha256 };
    }
    absolutePath(storageKey) {
        return (0, path_1.join)(this.root, storageKey);
    }
    async readStream(storageKey) {
        return (0, fs_1.createReadStream)(this.absolutePath(storageKey));
    }
    async exists(storageKey) {
        try {
            await (0, promises_1.stat)(this.absolutePath(storageKey));
            return true;
        }
        catch {
            return false;
        }
    }
    async remove(storageKey) {
        await (0, promises_1.unlink)(this.absolutePath(storageKey)).catch(() => undefined);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map