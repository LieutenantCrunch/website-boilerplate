import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinColumn, Repository} from 'typeorm';
import { User } from './User';
import { UserConnectionType } from './UserConnectionType';

@Entity('registered_user_connection')
export class UserConnection {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        type: 'int',
        name: 'requested_user_id'
    })
    requestedUserId: number;

    @Column({
        type: 'int',
        name: 'connected_user_id'
    })
    connectedUserId: number;

    @Column({
        type: 'boolean',
        name: 'is_mutual'
    })
    isMutual: Boolean;

    @ManyToOne(type => User, user => user.outgoingConnections)
    @JoinColumn({ name: 'requested_user_id', referencedColumnName: 'id' })
    requestedUser: User;

    @ManyToOne(type => User, user => user.incomingConnections)
    @JoinColumn({ name: 'connected_user_id', referencedColumnName: 'id' })
    connectedUser: User;

    @ManyToMany(type => UserConnectionType, connectionType => connectionType.connections, {onDelete: 'CASCADE'})
    connectionTypes: UserConnectionType[];
}