const db = require('sqlite');
const logger = require('./logger');


async function get(id) {
    return db.get('SELECT * FROM team WHERE id = ?', id);
}

async function getTeamParticipants(id, room) {
    return db.get('SELECT members FROM participants WHERE id = ? AND room = ?', id, room);
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


async function updateCustomPoints(teamId, customPoints) {
    const customPointsArr = customPoints.match(/\S+/g) || [];
    customPoints = customPointsArr.join(' ');
    if (!customPoints) customPoints = null;

    return db.run(
        `UPDATE
            team
        SET
            custom_points = $customPoints
        WHERE
            id = $id`,
        {
            $id: teamId,
            $customPoints: customPoints
        }
    );
}

async function participantCreateOrUpdate(id, room, members) {
    const roomMembers = await getTeamParticipants(id, room, members);
    if (!roomMembers)
        await addParticipants(id, room, members);
    else
        await updateParticipants(id, room, members);
    return getTeamParticipants(id, room);
}

async function addParticipants(teamId, room, participants) {
    const participantsArr = participants;
    logger.info(`add participants in db: ${participantsArr}`);
    return db.run(
        `INSERT INTO participants
            (id,room,members)
        VALUES
            ($id,$room,$participants)`,
        {
            $id: teamId,
            $room: room,
            $participants: participantsArr
        }
    );
}

async function updateParticipants(teamId, room, participants) {
    logger.info(`update participants in db: ${participants}`);
    return db.run(
        `UPDATE
            participants
        SET
            members = $participants
        WHERE
            id = $id
        AND
            room = $room`,
        {
            $id: teamId,
            $room: room,
            $participants: participants
        }
    );
}

async function deleteParticipants(teamId, room) {
    logger.info(`deleting permanent participants in ${room}`);
    return db.run(
        `DELETE FROM
            participants
        WHERE
            id = $id
        AND
            room = $room`,
        {
            $id: teamId,
            $room: room
        }
    );
}

module.exports = {get, getTeamParticipants, deleteParticipants, create, update, createOrUpdate, updateCustomPoints, participantCreateOrUpdate, addParticipants, updateParticipants};
