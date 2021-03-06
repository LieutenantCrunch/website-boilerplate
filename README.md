# website-boilerplate
#### Boilerplate Website App
This project was started with the goal of making a reusable baseline website with basic functionality that might be common to any number of websites. The idea is that this repository contains the foundations for a website so anyone desiring to set up a new website can fork/copy this to a new repository and hit the ground running.

# Prerequisites
1. **Database**
    - The project is currently set up to use MySQL and uses [TypeORM](https://github.com/typeorm/typeorm) for database connectivity. If you would like to use another type of database, you will have to edit the classes in the [entities directory](server/src/entity)
    - The database connection is configured in [databaseHelper.ts](server/src/utilities/databaseHelper.ts)
    - If you grant the database user the necessary privileges, TypeORM should automatically update your schema
    - If you do not want TypeORM managing your schema, the necessary queries (written for MySQL) can be found in ***TODO***
    - The database password is currently stored in \server\private\dbpass.txt, you will have to create this directory and text file manually, as they are not stored in this repository
1. **JWT Secret**
    - The JWT secret is currently stored in \server\private\jwtsecret.txt, you will have to create this directory and text file manually, as they are not stored in this repository

# Building
1. **Building the Server**
    - Run the following command in the server directory:
    - > npm run build:dev
1. **Building the Client**
    - Run the following command in the client directory:
    - > npm run build:dev

# Running
1. **Running the Server**
    - Run the following command in the server directory:
    - > npm run start:dev
