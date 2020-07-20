import bcrypt from 'bcryptjs';

export default class PasswordHelper {
    hashPassword (password: string) {
        bcrypt.genSalt(10, (saltError: Error, salt: string) => {
            if (saltError) {
                console.log('Error generating salt: ' + saltError.message);
                throw saltError;
            }
            else {
                bcrypt.hash(password, salt, (hashError: Error, hash: string) => {
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

    async verifyPassword (password: string, hash: string) {
        let result: Boolean = await bcrypt.compare(password, hash);

        console.log(result);
    }
};