import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from 'typeorm';
import { User } from './User';

@Entity('registered_user_display_name')
export class DisplayName {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        type: 'int',
        name: 'registered_user_id'
    })
    registeredUserId: number;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'display_name'
    })
    displayName: string;

    @Column({
        type: 'int',
        name: 'display_name_index',
    })
    displayNameIndex: number;

    @Column({
        type: 'datetime',
        name: 'activation_date'
    })
    activationDate: Date;

    @Column({
        type: 'boolean',
        name: 'is_active'
    })
    isActive: Boolean;

    @ManyToOne(type => User, user => user.displayNames)
    @JoinColumn({ name: 'registered_user_id', referencedColumnName: 'id' })
    registeredUser: User[];
}