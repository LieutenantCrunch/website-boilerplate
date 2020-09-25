import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany} from 'typeorm';
import { ProfilePicture } from './ProfilePicture';
import { UserJWT } from './UserJWT';
import { PasswordResetToken } from './PasswordResetToken';
import { DisplayName } from './DisplayName';
import { Role } from './Role';

@Entity('registered_user')
export class User {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'email'
    })
    email: string;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'display_name',
        nullable: true
    })
    displayName: string;

    @Column({
        length: 500,
        type: 'varchar',
        name: 'password_hash'
    })
    passwordHash: string;

    @Column({
        length: 36,
        type: 'varchar',
        name: 'unique_id'
    })
    uniqueID: string;

    @OneToMany(type => ProfilePicture, profilePicture => profilePicture.registeredUser, {onDelete: 'CASCADE'})
    profilePictures: ProfilePicture[];

    @OneToMany(type => UserJWT, userJWT => userJWT.registeredUser, {onDelete: 'CASCADE'})
    activeJWTs: UserJWT[];

    @OneToMany(type => UserJWT, userJWT => userJWT.formerRegisteredUser, {onDelete: 'CASCADE'})
    inactiveJWTs: Promise<UserJWT[]>;

    @OneToMany(type => PasswordResetToken, passwordResetToken => passwordResetToken.registeredUser, {onDelete: 'CASCADE'})
    passwordResetTokens: Promise<PasswordResetToken[]>;

    @OneToMany(type => DisplayName, displayName => displayName.registeredUser, {onDelete: 'CASCADE'})
    displayNames: DisplayName[];

    @ManyToMany(type => Role, role => role.users)
    roles: Role[];
}