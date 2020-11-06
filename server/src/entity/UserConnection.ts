import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from 'typeorm';
import { User } from './User';

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
    requestedUserId: string;

    @Column({
        type: 'int',
        name: 'connected_user_id'
    })
    connectedUserId: string;

    @Column({
        type: 'int',
        name: 'connection_type'
    })
    connectionType: number;

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
}