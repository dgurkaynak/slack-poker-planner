const db = require('sqlite');


async function get(id) {
    return db.get('SELECT * FROM team WHERE id = ?', id);
}


async function create(data) {
    return db.run(
        `INSERT INTO
            team (id, name, access_token, scope, user_id)
        VALUES
            ($id, $name, $access_token, $scope, $user_id)`,
        {
            $id: data.id,
            $name: data.name,
            $access_token: data.access_token,
            $scope: data.scope,
            $user_id: data.user_id
        }
    );
}


async function update(data) {
    return db.run(
        `UPDATE
            team
        SET
            name = $name,
            access_token = $access_token,
            scope = $scope,
            user_id = $user_id
        WHERE
            id = $id`,
        {
            $id: data.id,
            $name: data.name,
            $access_token: data.access_token,
            $scope: data.scope,
            $user_id: data.user_id
        }
    );
}


async function createOrUpdate(data) {
    const team = await get(data.id);
    if (!team)
        await create(data);
    else
        await update(data);
    return get(data.id);
}


module.exports = {get, create, update, createOrUpdate};
