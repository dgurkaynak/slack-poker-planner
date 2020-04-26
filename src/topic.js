const logger = require('./logger');
const rp = require('request-promise');
const shortid = require('shortid');
const _ = require('lodash');
const WebClient = require('@slack/web-api').WebClient;
const utils = require('./utils');


// In memory db for now
const topics = {};

// Summary of active topics in every minute
let lastActiveTopicsHash;
setInterval(() => {
    const ids = Object.keys(topics);
    const hash = ids.sort().join(',');
    if (hash == lastActiveTopicsHash) return;
    logger.info(
        ids.length == 0 ?
            `There is no active topics` :
            `There are ${ids.length} active topic(s): ${ids.join(', ')}`
    );
    lastActiveTopicsHash = hash;
}, 60000);


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


function createFromPPCommand(ppCommand, dbParticipants) {
    const id = shortid.generate();

    let mentions = [];
    // User mentions
    utils.matchAll(ppCommand.text, /<@(.*?)>/g).forEach((str) => {
        mentions.push({ type: 'user', id: str.split('|')[0] });
    });

    // Group mentions
    utils.matchAll(ppCommand.text, /<!(.*?)>/g).forEach((str) => {
        const specialMentions = ['everyone', 'channel', 'here'];
        if (specialMentions.indexOf(str) > -1) {
            mentions.push({ type: 'special', id: str });
        } else if (str.includes('subteam')) {
            // Custom user group mentions
            const [id, name] = str
                .replace('subteam^', '')
                .split('|');

            mentions.push({
                type: 'user-group',
                id,
                name
            });
        }
    });

    if (!!dbParticipants) {
      logger.info(`participants from DB ${Object.values(dbParticipants)}`);
      utils.matchAll(Object.values(dbParticipants), /<@(.*?)>/g).forEach((str) => {
          mentions.push({ type: 'user', id: str.split('|')[0] });
      });
    }

    // Remove duplicate mentions
    mentions = _.uniqBy(mentions, mention => `${mention.type}-${mention.id}`);

    // Get topic text
    const title = ppCommand.text
        .replace(/<@(.*?)>/g, '')
        .replace(/<!(.*?)>/g, '')
        .replace(/\s\s+/g, ' ')
        .trim();

    const participants = [];
    const votes = {};
    const isRevealed = false;
    const isCancelled = false;
    const topicMessage = null;

    return { id, title, ppCommand, mentions, participants, votes, isRevealed, isCancelled, topicMessage };
}


async function init(topic, team) {
    topic.points = [
        '0', '1/2', '1', '2', '3',
        '5', '8', '13', '20', '40',
        '100', '∞', '?'
    ];
    if (team.custom_points) {
        topic.points = team.custom_points.split(' ');
    }

    topic.participants = await decideParticipants(topic, team);
    await Promise.all([
        postTopicMessage(topic, team),
        save(topic)
    ]);
}

async function decideParticipants(topic, team) {
    const slackWebClient = new WebClient(team.access_token);
    // If there is no mention, must be work like @here
    const mentions = topic.mentions.length > 0 ? topic.mentions : [{ type: 'special', id: 'here' }];
    let participantIds = [topic.ppCommand.user_id]; // Creator must be participated

    // If @here or @channel mention is used, we need to fetch current channel members
    let channelMemberIds;
    const shouldFetchChannelMembers = _.some(mentions, (mention) => {
        return mention.type == 'special' && ['channel', 'here'].indexOf(mention.id) > -1;
    });

    if (shouldFetchChannelMembers) {
        const res = await slackWebClient.conversations.members({
            channel: topic.ppCommand.channel_id,
            limit: 100
        });
        channelMemberIds = res.members;

        if (channelMemberIds.length >= 100) {
            const err = new Error('Channel is too crowded');
            err.code = 'channel_too_crowded';
            throw err;
        }
    }

    // For each mention
    for (let mention of mentions) {
        if (mention.type == 'special') {
            // @channel mention
            if (mention.id == 'channel') {
                participantIds.push(...channelMemberIds);
            } else if (mention.id == 'here') {
                // @here mention

                if (channelMemberIds.length > 25) {
                    const err = new Error('Channel is too crowded for @here mention');
                    err.code = 'channel_too_crowded_for_here_mention';
                    throw err;
                }

                const presenceTasks = channelMemberIds.map(id => slackWebClient.users.getPresence({ user: id }));
                const presences = await Promise.all(presenceTasks);
                const channelActiveMemberIds = channelMemberIds.filter((id, index) => presences[index].presence == 'active');
                participantIds.push(...channelActiveMemberIds);
            }
        } else if (mention.type == 'user') {
            // @user mentions
            participantIds.push(mention.id);
        } else if (mention.type == 'user-group') {
            const res = await slackWebClient.usergroups.users.list({
                usergroup: mention.id
            });

            participantIds.push(...res.users);
        }
    }

    // Remove duplicates
    participantIds = _.uniq(participantIds);

    if (participantIds.length > 50) {
        const err = new Error('Too many participants');
        err.code = 'too_many_participants';
        throw err;
    }

    return participantIds;
}


async function postTopicMessage(topic, team) {
    const slackWebClient = new WebClient(team.access_token);
    topic.topicMessage = await slackWebClient.chat.postMessage({
        channel: topic.ppCommand.channel_id,
        text: `Please vote the topic: *"${topic.title}"* \nParticipants: ` +
            `${topic.participants.map(userId => `<@${userId}>`).join(' ')}`,
        attachments: buildTopicMessageAttachments(topic)
    });
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


async function refreshTopicMessage(topic, team) {
    const slackWebClient = new WebClient(team.access_token);

    if (topic.isRevealed) {
        await slackWebClient.chat.update({
            ts: topic.topicMessage.ts,
            channel: topic.topicMessage.channel,
            text: `Votes for topic *"${topic.title}"*: \n` +
                (_.map(topic.votes, (point, userId) => `<@${userId}>: *${point}*\n`).join('').trim() || 'No votes'),
            attachments: []
        });
    } else if (topic.isCancelled) {
        await slackWebClient.chat.update({
            ts: topic.topicMessage.ts,
            channel: topic.topicMessage.channel,
            text: `Cancelled topic *"${topic.title}"*`,
            attachments: []
        });
    } else {
        await slackWebClient.chat.update({
            ts: topic.topicMessage.ts,
            channel: topic.topicMessage.channel,
            text: `Please vote the topic: *"${topic.title}"* \nParticipants: ` +
                `${topic.participants.map(userId => {
                    // Strikethrough voted participants
                    const s = didVote(topic, userId) ? '~' : '';
                    return `${s}<@${userId}>${s}`;
                }).join(' ')}`,
            attachments: buildTopicMessageAttachments(topic)
        });
    }
}


async function revealTopicMessage(topic, team, userId) {
    const slackWebClient = new WebClient(team.access_token);
    topic.isRevealed = true;

    const votesText = _.map(topic.votes, (point, userId) => `<@${userId}>: *${point}*\n`).join('').trim() || 'No votes';
    await slackWebClient.chat.update({
        ts: topic.topicMessage.ts,
        channel: topic.topicMessage.channel,
        text: userId ?
            `Votes for the topic *"${topic.title}"*: (revealed by <@${userId}>)\n${votesText}` :
            `Votes for topic *"${topic.title}"*: \n${votesText}`,
        attachments: []
    });
    await remove(topic);
}


async function cancelTopicMessage(topic, team, userId) {
    const slackWebClient = new WebClient(team.access_token);
    topic.isCancelled = true;
    await slackWebClient.chat.update({
        ts: topic.topicMessage.ts,
        channel: topic.topicMessage.channel,
        text: `Cancelled topic *"${topic.title}"* by <@${userId}>`,
        attachments: []
    });
    await remove(topic);
}


function isParticipant(topic, userId) {
    return _.find(topic.participants, userId_ => userId == userId_);
}


async function vote(topic, team, userId, point) {
    topic.votes[userId] = point;

    if (Object.keys(topic.votes).length == topic.participants.length) {
        await revealTopicMessage(topic, team);
        logger.info(`[${team.name}(${team.id})] Auto revealing votes ` +
            `for "${topic.title}" w/ id: ${topic.id}`);
    } else {
        try {
            await refreshTopicMessage(topic, team);
        } catch (err) {
            logger.warn(`Could not refreshed topic after a vote, ${err}`)
        }
    }
}


function didVote(topic, userId) {
    return topic.votes.hasOwnProperty(userId);
}


function buildTopicMessageAttachments(topic) {
    const pointAttachments = _.chunk(topic.points, 5).map((points) => {
        return {
            text: '',
            fallback: 'You are unable to vote',
            callback_id: `vote:${topic.id}`,
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: points.map(point => ({
                name: 'point',
                text: point,
                type: 'button',
                value: point
            }))
        };
    });

    return [
        ...pointAttachments,
        {
            text: 'Actions',
            fallback: 'You are unable to send action',
            callback_id: `action:${topic.id}`,
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: [
                {
                    name: 'action',
                    text: 'Reveal',
                    type: 'button',
                    value: 'reveal',
                    style: 'danger'
                },
                {
                    name: 'action',
                    text: 'Cancel',
                    type: 'button',
                    value: 'cancel',
                    style: 'danger'
                }
            ]
        }
    ];
}


module.exports = {
    get,
    save,
    createFromPPCommand,
    postTopicMessage,
    isParticipant,
    init,
    rejectPPCommand,
    revealTopicMessage,
    cancelTopicMessage,
    vote
};
