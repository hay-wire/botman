/**
 * Created by haywire on 08/04/16.
 */

var moment = require('moment');
var _ = require('lodash');

var FBMessageModel = require('./../models/FBMessageLog');
/**
 *
 * @param api
 * @param msgTemplate
 * @param friendsList
 *
 * Way of working:
 * Divide the incoming task into multiple lists - preferably of 100 each.
 * Schedule each list to run later.
 *
 */
exports.sendMessages = function(api, msgTemplate, friendsList){
    var failedMsgs = [];
    var successMsgs = [];
    var msgPromises = [];

    friendsList.map(function(friendUserId){

        if(_.isEmpty(friendListIndex[friendUserId])){
            return;
        }
        var friend = friendListIndex[friendUserId];

        var msg = "Hi "+friend.firstName+"! I'm a testing bot who your friend summoned. Find me on http://botman.prashantdwivedi.co :)";
        if(req.body.message) msg = parseMessage(msgTemplate, friend);

        if(friend.userID) {
            console.log("sending msg to: ", friend.userID);
            var pr = new Promise(function(resolve, reject){
                api.sendMessage(msg, friend.userID, function(err, result){
                    if(err){
                        console.log("error sending msg to", friend.userID, err);
                        failedMsgs.push({
                            userID: friend.userID,
                            firstName: friend.firstName,
                            err: err
                        });
                    }
                    else {
                        console.log("success sending msg to", friend.userID, result);
                        successMsgs.push({
                            userID: friend.userID,
                            firstName: friend.firstName,
                            err: null
                        });
                    }
                    resolve();
                });
            });
            msgPromises.push(pr);
        }
        else {
            failedMsgs.push({
                userID: friend.userID,
                firstName: friend.firstName,
                err: new Error('BOTMAN_INVALID_FRIEND')
            });
            console.log("not sending to: ", friend);
        }
    });

    return Promise
        .all(msgPromises)
};


/**
 *
 * @param {String} userId - mongo's object id of the user profile
 * @param {Object} api - facebook session api object
 * @param {String} messageTemplate - message template
 * @param {Array} selectedFriendsList - array of (string) selected friends facebookId
 * @param {Array of objects} friendsList array of object from facebook-chat-api package
 */
exports.sendMessagesNow = function(userId, api, messageTemplate, selectedFriendsList, friendsList){
    // evenly distribute messages over to next minute and start

    var appState =  JSON.stringify(api.getAppState());

    var messageModel = new FBMessageModel({
        sender: userId,
        senderFBId: api.getCurrentUserID(),
        messageTemplate: messageTemplate,
        fbSessionApi: JSON.stringify(api.getAppState()),
        sentToCount: friendsList.length,
        requestInitiatedAt: { type: Date, default: Date.now },
        sendToList: []
    });

    var i = 2;
    selectedFriendsList.map(function(friendUserId) {
        console.log("adding friend to list: ", friendUserId);
        if(_.isEmpty(friendsList[friendUserId])){
            return Promise.reject(new Error('NO_FRIEND_SELECTED'));
        }
        var friend = friendsList[friendUserId];
        console.log("name: ", friend.firstName);

        messageModel.sendToList.push({
            receiverId: friendUserId,
            status: 0,
            scheduledFor: moment().add(i++, 'minutes'), // send one message per minute
            messageText: parseMessage(messageTemplate, friend),
            fbSessionApi: appState,
            deliveryAttempts: []
        });
    });

    console.log("saving message model");
    return new Promise(function(resolve, reject){
        messageModel.save(function(err, message){
            console.log("result of saving message: ", err, message);
            if(err) reject(err);
            else resolve(message.Id)
        });
    });
};

exports.scheduleMessages = function(api, messageTemplate, friendsList){
    // user is scheduling messages. Save encrypted api in Mongo.

    // now insert user message schedule threads in mongo

    // the cron which runs every minute, will get all the messages scheduled for next minute,
    // and corresponding session api from mongo's user's collection
    // then, it will send message to the friends scheduled this minute
    // and record the sending status

    // query help: https://docs.mongodb.org/manual/reference/operator/query/elemMatch/
};

var parseMessage = exports.parseMessage = function(msg, friend){
    var replacements = {
        '{firstname}': friend.firstName,
        '{fullname}': friend.fullName
    };

    for( var key in replacements){
        msg = msg.replace(new RegExp(key, 'g'), replacements[key]);
    }

    return msg;
};

