"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = void 0;
exports.ALLOWED_TRANSITIONS = {
    APPLICATION: ['APPROVED', 'REJECTED'],
    APPROVED: ['AWARDED', 'REJECTED'],
    AWARDED: ['LEGAL_DOCUMENTATION'],
    LEGAL_DOCUMENTATION: ['FUNDED'],
    FUNDED: ['IN_PROGRESS'],
    IN_PROGRESS: ['REPORTING'],
    REPORTING: ['VERIFICATION', 'IN_PROGRESS'],
    VERIFICATION: ['COMPLETED', 'REPORTING'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    REJECTED: [],
};
//# sourceMappingURL=project-status.map.js.map