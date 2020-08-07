import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm';
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

    @OneToOne(type => User, user => user.id)
    user: User;
}