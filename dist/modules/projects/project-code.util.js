"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextProjectCode = nextProjectCode;
async function nextProjectCode(tx, programId, programCode) {
    const year = new Date().getFullYear();
    const sequence = await tx.programYearSequence.upsert({
        where: { programId_year: { programId, year } },
        create: { programId, year, lastValue: 1 },
        update: { lastValue: { increment: 1 } },
    });
    const padded = String(sequence.lastValue).padStart(6, '0');
    return `DGST-${programCode}-${year}-${padded}`;
}
//# sourceMappingURL=project-code.util.js.map