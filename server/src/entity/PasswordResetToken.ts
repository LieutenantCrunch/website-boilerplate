import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from 'typeorm';
import { User } from './User';

@Entity('password_reset_token')
export class PasswordResetToken {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        type: 'datetime',
        name: 'expiration_date'
    })
    expirationDate: Date;

    @Column({
        type: 'int',
        name: 'registered_user_id',
        nullable: true
    })
    registeredUserId: number | null;

    @Column({
        length: 36,
        type: 'varchar',
        name: 'token'
    })
    token: string;

    @ManyToOne(type => User, user => user.passwordResetTokens)
    @JoinColumn({ name: 'registered_user_id', referencedColumnName: 'id' })
    registeredUser: User[];
}