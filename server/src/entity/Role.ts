import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable} from 'typeorm';
import { User } from './User';

@Entity('registered_user_role')
export class Role {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'role_name'
    })
    roleName: string;

    @ManyToMany(type => User, user => user.roles)
    @JoinTable({
        name: 'registered_user_role_junction',
        joinColumn: {
            name: 'registered_user_role_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'registered_user_id',
            referencedColumnName: 'id'
        }
    })
    users: User[];
}