const winston = require('winston');
const rp = require('request-promise');
const slackWeb = require('./slackweb');
const uuidV4 = require('uuid/v4');
const _ = require('lodash');
const EventEmitterExtra = require('event-emitter-extra');


class Topic extends EventEmitterExtra {
    constructor(command = {}) {
        super();

        this.id = uuidV4();
        this.command = command;
        this.title = null;
        this.participants = null;
        this.votes = {};
        this.isRevealed = false;
        this.resultMessage = null;
    }


    init() {
        this.title = this.command.text.split('<')[0].trim();
        const usernames = matchAll(this.command.text, /<@(.+)>/g).map(str => ({
            id: str.split('|')[0],
            name: str.split('|')[1]
        }));

        const participants = () => {
            if (usernames.length > 0) {
                usernames.push({
                    id: this.command.user_id,
                    name: this.command.user_name
                });
                this.participants = _.uniq(usernames, 'name');
                return Promise.resolve();
            }

            // Get online channel members
            let channelUserIds = [];
            return slackWeb[this.command.channel_name == 'privategroup' ? 'groups' : 'channels']
                .info(this.command.channel_id)
                .then((response) => {
                    channelUserIds = (response.channel || response.group).members;
                    const tasks = channelUserIds.map(id => slackWeb.users.getPresence(id));
                    return Promise.all(tasks);
                })
                .then(responses => channelUserIds.filter((id, index) => responses[index].presence == 'active'))
                .then((onlineUserIds) => {
                    const tasks = onlineUserIds.map(id => slackWeb.users.info(id));
                    return Promise.all(tasks);
                })
                .then((responses) => {
                    this.participants = responses.map(response => ({
                        id: response.user.id,
                        name: response.user.name
                    }));
                });
        };

        if (!this.title) {
            return this.rejectCommand('Please provide a valid topic name');
        }

        if (this.command.channel_name == 'directmessage') {
            return this.rejectCommand('Poker planning cannot be started in direct messages.');
        }

        return participants()
            .then(() => this.postMessage());
    }


    vote(username, point) {
        const user = _.find(this.participants, user => user.name == username);
        if (!user)
            return Promise.reject(new Error('You are not a participant for this topic.'));

        if (this.isRevealed)
            return Promise.reject(new Error('You could not vote revealed topic.'));

        this.votes[username] = {point, user};
        this.emit('voted', this.votes[username]);

        if (Object.keys(this.votes).length == this.participants.length) {
            this.reveal();
        }

        return Promise.resolve();
    }

    reveal() {
        this.isRevealed = true;

        slackWeb.chat.update(
            this.resultMessage.ts,
            this.resultMessage.channel,
            `Votes for topic *"${this.title}"*: \n` + _.map(this.votes, (vote) => `<@${vote.user.id}|${vote.user.name}>: *${vote.point}*\n`).join('').trim() || 'No votes',
            {
                attachments: []
            }
        ).catch((err) => {
            winston.error('Could not reveal result', err);
        }).then(() => {
            this.emit('revealed');
        });
    }


    rejectCommand(reason) {
        return rp({
            uri: this.command.response_url,
            method: 'POST',
            body: {
                text: reason,
                response_type: 'ephemeral'
            },
            json: true
        }).catch((err) => {
            winston.error('Could not reject pp-command', err);
            throw err;
        });
    }


    postMessage() {
        return new Promise((resolve, reject) => {
            slackWeb.chat.postMessage(
                this.command.channel_id,
                `Please vote the topic: *"${this.title}"* \nParticipants: ${this.participants.map(user => `<@${user.id}|${user.name}>`).join(' ')}`,
                {
                    attachments: [
                        {
                            text: '',
                            fallback: 'You are unable to vote',
                            callback_id: `vote_${this.id}`,
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
                            callback_id: `vote_${this.id}`,
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
                            callback_id: `action_${this.id}`,
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
                }, (err, res) => {
                    if (err) {
                        winston.error('Could not post message', err);
                        return reject(err);
                    }

                    this.resultMessage = res;
                    resolve(res);
                });
        });
    }
}

function matchAll(str, regex) {
    var res = [];
    var m;
    if (regex.global) {
        while (m = regex.exec(str)) {
            res.push(m[1]);
        }
    } else {
        if (m = regex.exec(str)) {
            res.push(m[1]);
        }
    }
    return res;
}

module.exports = Topic;
