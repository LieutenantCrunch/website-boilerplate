import {Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn} from 'typeorm';
import { ProfilePicture } from './ProfilePicture';

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

    @OneToMany(type => ProfilePicture, profilePicture => profilePicture.registeredUserId)
    @JoinColumn({ name: 'id', referencedColumnName: 'registered_user_id' })
    profilePicture: ProfilePicture;
}