"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordHelper {
    hashPassword(password) {
        bcryptjs_1.default.genSalt(10, (saltError, salt) => {
            if (saltError) {
                console.log('Error generating salt: ' + saltError.message);
                throw saltError;
            }
            else {
                bcryptjs_1.default.hash(password, salt, (hashError, hash) => {
                    if (hashError) {
                        console.log('Error Hashing: ' + hashError.message);
                        throw hashError;
                    }
                    else {
                        console.log(hash);
                    }
                });
            }
        });
    }
    async verifyPassword(password, hash) {
        let result = await bcryptjs_1.default.compare(password, hash);
        console.log(result);
    }
}
exports.default = PasswordHelper;
;
//# sourceMappingURL=passwordHelper.js.map