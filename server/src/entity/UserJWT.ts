import {Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, JoinColumn} from 'typeorm';
import { User } from './User';

@Entity('user_jwt')
export class UserJWT {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        length: 36,
        type: 'varchar',
        name: 'jti'
    })
    jti: string;

    @Column({
        type: 'datetime',
        name: 'expiration_date'
    })
    expirationDate: Date;

    @Column({
        type: 'boolean',
        name: 'is_valid'
    })
    isValid: Boolean;

    @Column({
        type: 'int',
        name: 'registered_user_id',
        nullable: true
    })
    registeredUserId: number | null;

    @Column({
        type: 'int',
        name: 'former_registered_user_id',
        nullable: true
    })
    formerRegisteredUserId: number | null;

    @ManyToOne(type => User, user => user.activeJWTs)
    @JoinColumn({ name: 'registered_user_id', referencedColumnName: 'id' })
    registeredUser: User[];

    @ManyToOne(type => User, user => user.inactiveJWTs)
    @JoinColumn({ name: 'former_registered_user_id', referencedColumnName: 'id' })
    formerRegisteredUser: Promise<User[]>;
}