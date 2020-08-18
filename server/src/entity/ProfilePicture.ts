import {Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, JoinColumn, RelationId} from 'typeorm';
import { User } from './User';

@Entity('profile_picture')
export class ProfilePicture {

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
        length: 50,
        type: 'varchar',
        name: 'mime_type',
    })
    mimeType: string;

    @Column({
        length: 200,
        type: 'varchar',
        name: 'file_name'
    })
    fileName: string;

    @Column({
        length: 150,
        type: 'varchar',
        name: 'original_file_name'
    })
    originalFileName: string

    @Column({
        length: 206,
        type: 'varchar',
        name: 'small_file_name'
    })
    smallFileName: string;

    @ManyToOne(type => User, user => user.profilePictures)
    @JoinColumn({ name: 'registered_user_id', referencedColumnName: 'id' })
    registeredUser: User[];
}