#BotMan

Checkout this project live at [botman.in](https://www.botman.in/?UTM_SOURCE=github-project).

## BotMan | The Exotic Bots Collection

This project is intended to be a collection of useful bots who assist you in daily works, sort of digital companions. 
For now, I'm starting with Loki - the facebook messaging bot who will send your messages to all (or the ones you select) 
the people in your facebook friends' list. Hope to add more soon.
 
## Setting up the project

Follow the below steps to install and run Botman on your system.

1. Install the following components on your system:
    * Node.js version >= v4.3
    * npm version 2.x
    * Mongodb (preferably v3.2+)
    * clone this repo    
1. Make sure mongodb is running.   
1. `cd` to Botman repo folder.
1. Copy `.env.example` file to `.env` and configure the services with your keys (the current ones are borrowed from hackathon-starter project) 
1. Install the dependencies using npm command: `npm install`.
1. create a screen (or use any other method if you want) using the `screen -S botman` command.
1. Inside botman screen, start the server using this command: `npm start`. Wait for a few seconds to see it doesn't crash.
1. Come out of botman screen by pressing `ctrl+a` then `d` key.
1. Add a cron to send messages using `crontab -e` command. Configure it to run every minute:
        `* * * * * /usr/local/bin/node /var/www/botman.in/components/FBMessageCron.js >> /var/logs/FBMessageCron.log`
1. Done.

Don't want to run through all these steps? I have hosted it for you on [botman.in](https://www.botman.in/?UTM_SOURCE=github-project).
    
## Using Loki - The Facebook Messaging Bot

Now point your browser to http://localhost:3000/ and click on "Loki - The FB Bot" link. Login into your facebook account 
using your facebook username and password.

The following macros are available in message body for usage: `{firstname}`, `{fullname}`. 

Use it like:  ``` Hey {firstname}! Come check botman.in project. It's amazingly cool! :) ``` in the message body.
  Now choose the friends you want to send the message to, and click on `send` button to queue the messages. 
  The messages are scheduled to be sent at 1 message per minute. Bombarding a lot of messages at once might cause 
   facebook to stop your messaging service!     
   
  Cheers! :)
