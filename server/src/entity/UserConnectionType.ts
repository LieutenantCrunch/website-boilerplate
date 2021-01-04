import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable} from 'typeorm';
import { UserConnection } from './UserConnection';

@Entity('registered_user_connection_type')
export class UserConnectionType {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'display_name',
        unique: true
    })
    displayName: string;

    @ManyToMany(type => UserConnection, connection => connection.connectionTypes)
    @JoinTable({
        name: 'registered_user_connection_type_junction',
        joinColumn: {
            name: 'registered_user_connection_type_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'registered_user_connection_id',
            referencedColumnName: 'id'
        }
    })
    connections: UserConnection[];
}