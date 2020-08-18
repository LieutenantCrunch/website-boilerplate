import {Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn} from 'typeorm';
import { ProfilePicture } from './ProfilePicture';
import { UserJWT } from './UserJWT';

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
}