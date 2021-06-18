import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import * as ServerConstants from '../../../constants/constants.server';

import { models } from '../../../models/_index';
import { PasswordResetTokenInstance } from '../../../models/PasswordResetToken';
import { UserInstance } from '../../../models/User';
import { UserJWTInstance } from '../../../models/UserJWT';

import { getUserWithUniqueId } from './searches';

export const addJWTToUser = async function(uniqueId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
    try
    {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);
        
        if (registeredUser) {
            let newJWT: UserJWTInstance | null = await registeredUser.createActiveJWT({
                ...jwtInfo,
                isValid: true
            });

            if (newJWT) {
                return {success: true};
            }
        }
    }
    catch (err)
    {
        console.error(`Error adding new JWT to user ${uniqueId}: ${err.message}`);
    }

    return {success: false};
}

export const extendJWTForUser = async function(uniqueId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            attributes: [
                'id'
            ],
            where: {
                uniqueId
            },
            include: {
                model: models.UserJWT,
                as: 'activeJWTs',
                required: true,
                where: {
                    jti: jwtInfo.jti
                }
            }
        });
        
        if (registeredUser && registeredUser.activeJWTs) {
            let activeJWT: UserJWTInstance = registeredUser.activeJWTs[0];
            
            activeJWT.expirationDate = jwtInfo.expirationDate;
            activeJWT.save();

            return {success: true};
        }
    }
    catch (err)
    {
        console.error(`Error extending JWT for user ${uniqueId}: ${err.message}`);
    }

    return {success: false};
}

export const generatePasswordResetToken = async function(email: string): Promise<{token: string | null, errorCode: number}> {
    let errorCode: number = 0;
    let token: string | null = null;

    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            attributes: [
                'id'
            ],
            where: {
                email
            },
            include: {
                model: models.PasswordResetToken,
                as: 'passwordResetTokens',
                required: false,
                where: {
                    expirationDate: {
                        [Op.gt]: (new Date())
                    }
                }
            }
        });

        if (registeredUser) {
            if (registeredUser.passwordResetTokens && registeredUser.passwordResetTokens.length < ServerConstants.RPT_MAX_ACTIVE_TOKENS) {
                let tempToken: string = uuidv4();

                let expirationDate: Date = new Date(Date.now()).addMinutes(ServerConstants.RPT_EXPIRATION_MINUTES);

                await registeredUser.createPasswordResetToken({
                    token: tempToken,
                    expirationDate
                });

                // Set token after the database interaction so a token doesn't get returned if it fails
                token = tempToken;

                errorCode = 0;
            }
            else {
                errorCode = 3;
            }
        }
        else {
            errorCode = 2;
        }
    }
    catch (err)
    {
        console.error(err.message);
        errorCode = 1;
    }

    return {token, errorCode};
}

export const invalidateJWTsForUser = async function(uniqueId: string, mode: number = ServerConstants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
    try
    {
        if (!jti) { // If we don't have an ID, then we have to expire all of them
            mode = ServerConstants.INVALIDATE_TOKEN_MODE.ALL;
        }

        let additionalQueryOptions: {[key: string]: any;} = {};
        
        switch (mode) {
            case ServerConstants.INVALIDATE_TOKEN_MODE.ALL:
                break;
            case ServerConstants.INVALIDATE_TOKEN_MODE.OTHERS:
                additionalQueryOptions = {
                    jti: {
                        [Op.ne]: jti
                    }
                };
                break;
            case ServerConstants.INVALIDATE_TOKEN_MODE.SPECIFIC:
            default:
                additionalQueryOptions = {
                    jti
                };    
                break;
        }

        let registeredUser: UserInstance | null = await models.User.findOne({
            attributes: [
                'id'
            ],
            where: {
                uniqueId
            },
            include: {
                model: models.UserJWT,
                as: 'activeJWTs',
                required: true,
                where: {
                    isValid: 1,
                    expirationDate: {
                        [Op.gt]: (new Date())
                    },
                    ...additionalQueryOptions
                }
            }
        });

        if (registeredUser && registeredUser.activeJWTs) {
            let activeJWTs: UserJWTInstance[] = registeredUser.activeJWTs;
            let idArray: number[] = activeJWTs.map(activeJWT => activeJWT.id!);

            await models.UserJWT.update(
                {
                    isValid: false
                },
                {
                    where: {
                        id: idArray
                    }
                }
            );

            await registeredUser!.removeActiveJWTs(activeJWTs);
            await registeredUser!.addInactiveJWTs(activeJWTs);

            return {success: true};
        }
    }
    catch (err)
    {
        console.error(`Error Invalidating JWTs: ${err.message}`);
    }

    return {success: false};
}

export const updateCredentials = async function(email: string, password: string): Promise<Boolean> {
    try
    {
        let salt: string = await bcrypt.genSalt(10);
        let hash: string = await bcrypt.hash(password, salt);
        let registeredUser: UserInstance | null = await models.User.findOne({
            where: {
                email
            }
        });

        if (registeredUser) {
            registeredUser.passwordHash = hash;
            await registeredUser.save();

            return true;
        }
    }
    catch (err)
    {
        console.error(err.message);
    }

    return false;
}

export const validateCredentials = async function(email: string, password: string): Promise<string | null> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            attributes: [
                'passwordHash',
                'uniqueId'
            ],
            where: {
                email
            }
        });

        if (registeredUser) {
            let passwordHash: string = registeredUser.passwordHash;
            let isValid = await bcrypt.compare(password, passwordHash);

            if (isValid) {
                return registeredUser.uniqueId;
            }
        }
    }
    catch (err)
    {
        console.error(`Failed to validate credentials for ${email}:\n${err.message}`);
    }

    return null;
}

export const validateJWTForUserId = async function(uniqueId: string, jti: string): Promise<Boolean> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            attributes: [
                'id'
            ],
            where: {
                uniqueId
            }
        });

        if (registeredUser) {
            let activeJWTs: UserJWTInstance[] = await registeredUser.getActiveJWTs({
                where: {
                    jti,
                    isValid: 1,
                    expirationDate: {
                        [Op.gt]: (new Date())
                    }
                }
            });

            if (activeJWTs.length > 0) {
                return true;
            }
        }
    }
    catch (err)
    {
        console.error(`Error looking up JTI for user with id ${uniqueId}: ${err.message}`);
    }

    return false;
}

export const validatePasswordResetToken = async function(token: string, email: string): Promise<Boolean> {
    try
    {
        let resetToken: PasswordResetTokenInstance | null = await models.PasswordResetToken.findOne({
            where: {
                token
            },
            include: {
                model: models.User,
                as: 'registeredUser',
                required: true,
                where: {
                    email
                }
            }
        });

        if (resetToken) {
            return true;
        }
    }
    catch (err)
    {
        console.error(err.message);
    }

    return false;
}
