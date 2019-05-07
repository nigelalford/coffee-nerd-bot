/**
 * A Bot for Slack!
 */

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
  if (installer) {
    bot.startPrivateConversation({ user: installer }, function(err, convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say("I am a bot that has just joined your team");
        convo.say(
          "You must now /invite me to a channel so that I can be of use!"
        );
      }
    });
  }
}

/**
 * Configure the persistence options
 */

// Load process.env values from .env file
require("dotenv").config();

var config = {};
if (process.env.MONGOLAB_URI) {
  var BotkitStorage = require("botkit-storage-mongo");
  config = {
    storage: BotkitStorage({ mongoUri: process.env.MONGOLAB_URI , tables: ['coffee']})
  };
} else {
  config = {
    json_file_store: process.env.TOKEN
      ? "./db_slack_bot_ci/"
      : "./db_slack_bot_a/" //use a different name if an app or CI
  };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
  //Treat this as a custom integration
  var customIntegration = require("./lib/custom_integrations");
  var token = process.env.TOKEN ? process.env.TOKEN : process.env.SLACK_TOKEN;
  var controller = customIntegration.configure(token, config, onInstallation);
} else if (
  process.env.CLIENT_ID &&
  process.env.CLIENT_SECRET &&
  process.env.PORT
) {
  //Treat this as an app
  var app = require("./lib/apps");
  var controller = app.configure(
    process.env.PORT,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    config,
    onInstallation
  );
} else {
  console.log(
    "Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment"
  );
  process.exit(1);
}

/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on("rtm_open", function(bot) {
  console.log("** The RTM api just connected!");
});

controller.on("rtm_close", function(bot) {
  console.log("** The RTM api just closed");
  // you may want to attempt to re-open
});

/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

const mention = ["direct_mention", "mention", "direct_message"];
const menu = [
  {
    name: "Field Trip",
    roaster: "Counter Culture",
    url: "https://counterculturecoffee.com/shop/merchandise/field-trip-mug"
  },
  {
    name: "Mexican Radio",
    roaster: "Radio Roasters",
    url: "https://www.radioroasters.com/shop/mexradio2019"
  }
];
// add menu from db or object model

controller.on("bot_channel_join", function(bot, message) {
  //add a coffee related phrase
  bot.reply(message, "Its coffee time");
});

controller.hears("hello", mention, (bot, message) => {
  bot.reply(message, "Hello!");
});

controller.hears("menu", mention, (bot, msg) => {
  const a = `${menu[0].name} by: ${menu[0].roaster}`;
  a.link = menu[0].url;

  const b = `${menu[1].name} by: ${menu[1].roaster}`;
  b.link = menu[1].url;

  bot.reply(msg, `Today we have: \n - ${a} \n - ${b}`);
});

controller.hears(['add'], mention, (bot, msg) => {
    const text = msg.text.replace('add', '').trim();
    controller.storage.coffee.save({
        id: Date.now(),
        name: text
    })
    bot.reply(msg, `added: ${text}`);

    controller.storage.coffee.all((err, coffee) => {
      // create a unique, querable id
      // model the db for consistent writing
      // make a convesation so the user can add name and brand

      if (err) return console.error(err);
      if(coffee) {
        bot.reply(msg, `Here's a list of our coffees`);
        coffee.forEach((bean) => {
          bot.reply(msg, bean.name);
        });
      }
    });
});

/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});
