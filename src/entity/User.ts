import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity('registered_user')
export class User {

    @PrimaryGeneratedColumn({
        type: 'int'
    })
    id: number;

    @Column({
        length: 100,
        type: 'varchar',
        name: 'display_name'
    })
    displayName: string;

    @Column({
        length: 50,
        type: 'varchar',
        name: 'username'
    })
    username: string;
}