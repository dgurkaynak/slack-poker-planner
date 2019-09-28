# slack-poker-planner

Poker planning app for Slack. You can directly add it to your slack team from:

[https://deniz.co/slack-poker-planner](https://deniz.co/slack-poker-planner/)

![Demonstration](demo.gif)

## Setup

For any reason, if you want to host your own app, follow this steps.

### Creating slack app

- Create a new Slack app [from here](https://api.slack.com/apps).
- Create a new Slash Command `/pp` (or any command you want) and set request url as `http://my.awesome.project.url/slack/pp-command`
    - Make sure that "Escape channels, users, and links sent to your app" option is turned on
- Activate Interactive Messages with request url `http://my.awesome.project.url/slack/action-endpoint`, options load url is not used, you can leave it blank.
- Add a new OAuth Redirect URL: `http://my.awesome.project.url/oauth`
- Required permission scopes: `commands`, `channels:read`, `chat:write:bot`, `groups:read`, `users:read`


### Running

- Clone this repo
- Install dependencies with `npm i` or `yarn`
- Start the app with `npm start`

**Environment variables:**
- **`PORT`**: Port number for webserver. Default: `3000`
- **`BASE_PATH`**: If you're not serving from root, set this variable. Default: `/`
- **`SLACK_CLIENT_ID`**: Slack client id, default null
- **`SLACK_CLIENT_SECRET`**: Slack client secret, default null
- **`SLACK_VERIFICATION_TOKEN`**: Slack verification token, default null
