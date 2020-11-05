import {ViewEntity, ViewColumn} from 'typeorm';

@ViewEntity({
    expression: `
        SELECT \`c1\`.\`requested_user_id\` as \`user_1\`
            , \`c1\`.\`connected_user_id\` as \`user_2\`
        FROM registered_user_connection as \`c1\`
        UNION
        SELECT \`c2\`.\`connected_user_id\` as \`user_1\`
            , \`c2\`.\`requested_user_id\` as \`user_2\`
        FROM registered_user_connection as \`c2\`
    `
})
export class ConnectionView {
    @ViewColumn({
        name: 'user_1'
    })
    user1: string;

    @ViewColumn({
        name: 'user_2'
    })
    user2: string;
}