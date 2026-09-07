"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDataAgainstSchema = validateDataAgainstSchema;
exports.findField = findField;
const common_1 = require("@nestjs/common");
function validateDataAgainstSchema(data, schema, path = '') {
    for (const field of schema) {
        const value = data?.[field.key];
        const fieldPath = path ? `${path}.${field.key}` : field.key;
        if (field.type === 'table') {
            if (value === undefined || value === null) {
                if (field.required) {
                    throw new common_1.BadRequestException(`Missing required field: ${fieldPath}`);
                }
                continue;
            }
            if (!Array.isArray(value)) {
                throw new common_1.BadRequestException(`Field ${fieldPath} must be a list of rows`);
            }
            if (field.minRows && value.length < field.minRows) {
                throw new common_1.BadRequestException(`Field ${fieldPath} requires at least ${field.minRows} row(s)`);
            }
            if (field.maxRows && value.length > field.maxRows) {
                throw new common_1.BadRequestException(`Field ${fieldPath} allows at most ${field.maxRows} row(s)`);
            }
            value.forEach((row, i) => validateDataAgainstSchema(row ?? {}, field.columns ?? [], `${fieldPath}[${i}]`));
            continue;
        }
        if (field.type === 'section') {
            validateDataAgainstSchema(value ?? {}, field.fields ?? [], fieldPath);
            continue;
        }
        if (field.required && (value === undefined || value === null || value === '')) {
            throw new common_1.BadRequestException(`Missing required field: ${fieldPath}`);
        }
    }
}
function findField(schema, key) {
    return schema.find((f) => f.key === key);
}
//# sourceMappingURL=form-schema.validator.js.map