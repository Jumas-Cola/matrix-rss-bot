# `matrix-rss-bot` Bot that fetches RSS feeds and posts them to a room

Bot created with [matrix-bot-sdk](https://www.npmjs.com/package/matrix-bot-sdk).

```
!bot help             - This menu
!bot add-rss [url]    - Add rss to feed.
!bot rm-rss [url]     - Remove rss from feed.
!bot list-rss         - List all rss feeds.
```

## Most important news list with Groq AI

For this feature add in config:

```yaml
openAiApiUrl: "https://openaiapi.test/api/v1"
openAiApiKey: "XXXXXXXXXXXXXXXXXXXX"
openAiApiModel: "gpt-3.5-turbo"
```

## Projects using this template

- [matrix-zammad](https://github.com/Half-Shot/matrix-zammad) by [Half-Shot](https://github.com/Half-Shot)

Want your project listed? [Edit this doc](https://github.com/turt2live/matrix-bot-sdk-bot-template/edit/master/README.md).

## Running / Building

After clicking the 'use this template' button and cloning the repo, you'll need to install the dependencies
and open an editor to get started. This assumes you have at least **NodeJS 14 or higher**.

1. Replace this README with something useful.
2. Update your project's details in `package.json`.
3. Run `npm install` to get the dependencies.

To build it: `npm run build`.

To run it: `npm run start:dev`

To check the lint: `npm run lint`

To build the Docker image: `docker build -t your-bot:latest .`

To run the Docker image (after building): `docker run --rm -it -v $(pwd)/config:/bot/config your-bot:latest`
*Note that this will require a `config/production.yaml` file to exist as the Docker container runs in production mode.*

### Configuration

This template uses a package called `config` to manage configuration. The default configuration is offered
as `config/default.yaml`. Copy/paste this to `config/development.yaml` and `config/production.yaml` and edit
them accordingly for your environment.

## Project structure

This is a somewhat opinionated template that is runnable out of the box. The project is TypeScript with
a linter that matches the bot-sdk itself. All the good bits of the bot are under `src/`.

### `src/index.ts`

This is where the bot's entry point is. Here you can see it reading the config, preparing the storage,
and setting up other stuff that it'll use throughout its lifetime. Nothing in here should really require
modification - most of the bot is elsewhere.

### `src/commands/handler.ts`

When the bot receives a command (see `index.ts` for handoff) it gets processed here. The command structure
is fairly manual, but a basic help menu and processing for a single command is there.

### `src/commands/hello.ts`

This is the bot's `!bot hello` command. It doesn't do much, but it is an example.

### `src/config.ts`

This is simply a typescript interface for your config so you can make use of types.

### `lib/`

This is where the project's build files go. Not really much to see here.

### `storage/`

This is the default storage location. Also not much to see here.

## Help!

Come visit us in [#matrix-bot-sdk:t2bot.io](https://matrix.to/#/#matrix-bot-sdk:t2bot.io) on Matrix if you're
having trouble with this template.

## Credits

Credit to anoa's [matrix-nio template](https://github.com/anoadragon453/nio-template) for the README format.
