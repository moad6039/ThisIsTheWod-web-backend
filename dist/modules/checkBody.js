"use strict";
// backend/modules/checkBody.ts
// Vérifie que tous les champs requis sont présents et non vides.
// Identique à checkBody.js du mobile.
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBody = checkBody;
function checkBody(body, keys) {
    for (const field of keys) {
        const v = body[field];
        if (v === undefined || v === null || v === "")
            return false;
    }
    return true;
}
