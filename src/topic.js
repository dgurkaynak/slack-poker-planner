const rp = require('request-promise');
const uuidV4 = require('uuid/v4');
const _ = require('lodash');
const WebClient = require('@slack/client').WebClient;
const utils = require('./utils');


// In memory db for now
const topics = {};


async function get(id) {
    return topics[id];
}


async function save(topic) {
    topics[topic.id] = topic;
    return topic;
}


async function remove(topic) {
    delete topics[topic.id];
}


function createFromPPCommand(ppCommand) {
    const id = uuidV4();
    const title = ppCommand.text.split('<')[0].trim();
    const mentions = utils.matchAll(ppCommand.text, /<@(.+)>/g).map(str => ({
        id: str.split('|')[0],
        name: str.split('|')[1]
    }));
    const participants = [];
    const votes = {};
    const isRevealed = false;
    const topicMessage = null;

    return {id, title, ppCommand, mentions, participants, votes, isRevealed, topicMessage};
}


async function init(topic, team) {
    if (!topic.title) {
        throw new Error('Please provide a valid topic name');
    }

    if (topic.ppCommand.channel_name == 'directmessage') {
        throw new Error('Poker planning cannot be started in direct messages.');
    }

    topic.participants = await decideParticipants(topic, team);
    await postTopicMessage(topic, team);
    await save(topic);
}


async function decideParticipants(topic, team) {
    const slackWebClient = new WebClient(team.access_token);

    // Custom mentioned participants
    if (topic.mentions.length > 0) {
        const mentionsIncludingSelf = topic.mentions.concat([{
            id: topic.ppCommand.user_id,
            name: topic.ppCommand.user_name
        }]);
        const participants = _.uniq(mentionsIncludingSelf, 'name');
        return participants;
    }

    // No mentions, get active users of current channel/group
    const apiNamespace = topic.ppCommand.channel_name == 'privategroup' ? 'groups' : 'channels';
    const info = await slackWebClient[apiNamespace].info(topic.ppCommand.channel_id);
    const channelUserIds = (info.channel || info.group).members;
    const presenceTasks = channelUserIds.map(id => slackWebClient.users.getPresence(id));
    const presences = await Promise.all(presenceTasks);
    const onlineUserIds = channelUserIds.filter((id, index) => presences[index].presence == 'active')
    const infoTasks = onlineUserIds.map(id => slackWebClient.users.info(id));
    const infos = await Promise.all(infoTasks);
    return infos.map(response => ({
        id: response.user.id,
        name: response.user.name
    }));
}


async function postTopicMessage(topic, team) {
    const slackWebClient = new WebClient(team.access_token);
    topic.topicMessage = await slackWebClient.chat.postMessage(
        topic.ppCommand.channel_id,
        `Please vote the topic: *"${topic.title}"* \nParticipants: ` +
            `${topic.participants.map(user => `<@${user.id}|${user.name}>`).join(' ')}`,
        buildTopicMessageOptions(topic)
    );
}


function buildTopicMessageOptions(topic) {
    return {
        attachments: [
            {
                text: '',
                fallback: 'You are unable to vote',
                callback_id: `vote_${topic.id}`,
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [
                    {
                        name: 'point',
                        text: '0',
                        type: 'button',
                        value: '0'
                    },
                    {
                        name: 'point',
                        text: '1',
                        type: 'button',
                        value: '1'
                    },
                    {
                        name: 'point',
                        text: '2',
                        type: 'button',
                        value: '2'
                    },
                    {
                        name: 'point',
                        text: '3',
                        type: 'button',
                        value: '3'
                    },
                    {
                        name: 'point',
                        text: '5',
                        type: 'button',
                        value: '5'
                    }
                ]
            },
            {
                text: '',
                fallback: 'You are unable to vote',
                callback_id: `vote_${topic.id}`,
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [
                    {
                        name: 'point',
                        text: '8',
                        type: 'button',
                        value: '8'
                    },
                    {
                        name: 'point',
                        text: '13',
                        type: 'button',
                        value: '13'
                    },
                    {
                        name: 'point',
                        text: '20',
                        type: 'button',
                        value: '20'
                    },
                    {
                        name: 'point',
                        text: '40',
                        type: 'button',
                        value: '40'
                    },
                    {
                        name: 'point',
                        text: '100',
                        type: 'button',
                        value: '100'
                    }
                ]
            },
            {
                text: 'Actions',
                fallback: 'You are unable to send action',
                callback_id: `action_${topic.id}`,
                color: '#3AA3E3',
                attachment_type: 'default',
                actions: [
                    {
                        name: 'action',
                        text: 'Reveal Votes',
                        type: 'button',
                        value: 'reveal',
                        style: 'danger'
                    }
                ]
            }
        ]
    };
}


function rejectPPCommand(ppCommand, reason) {
    return rp({
        uri: ppCommand.response_url,
        method: 'POST',
        body: {
            text: reason,
            response_type: 'ephemeral'
        },
        json: true
    });
}


async function reveal(topic, team) {
    const slackWebClient = new WebClient(team.access_token);
    topic.isRevealed = true;
    await slackWebClient.chat.update(
        topic.topicMessage.ts,
        topic.topicMessage.channel,
        `Votes for topic *"${topic.title}"*: \n` +
            (_.map(topic.votes, (vote) => `<@${vote.user.id}|${vote.user.name}>: *${vote.point}*\n`).join('').trim() || 'No votes'),
        { attachments: [] }
    );
    await remove(topic);
}


async function vote(topic, team, username, point) {
    if (topic.isRevealed)
        throw new Error('You could not vote revealed topic.');

    const user = _.find(topic.participants, user => user.name == username);
    if (!user)
        throw new Error('You are not a participant for this topic.');

    topic.votes[username] = {point, user};

    if (Object.keys(topic.votes).length == topic.participants.length) {
        return reveal(topic, team);
    }
}


module.exports = {
    get,
    createFromPPCommand,
    init,
    rejectPPCommand,
    reveal,
    vote
};
