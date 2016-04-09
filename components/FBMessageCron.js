/**
 * Created by haywire on 08/04/16.
 */

var moment = require('moment');
var FBMessageModel = require('./../models/FBMessageLog');
var mongoose = require('mongoose');
var FBUtils = require('./FBUtils');
require('dotenv').load({ path: './../.env' });

(function connectDB(){
    console.log('connecting to mongo..');
    mongoose.connect(process.env.MONGODB || process.env.MONGOLAB_URI);
    mongoose.connection.on('error', function() {
        console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
        process.exit(1);
    });
})();

var fbSessionAPIBag = {};
var sendMessages = function(fromTimestamp, toTimestamp){

    return FBMessageModel.findScheduledMessages(fromTimestamp, toTimestamp, function(err, res){ console.log("hi: ", err, res) })
        .then(function(messageLogs){
            console.log("Processing "+ messageLogs.length);
            if(!messageLogs.length){
                throw new Error('NO_MESSAGES_SCHEDULED');
            }
            return messageLogs;
        })

        .then(function(messageLogs) {
            // iterate over all the messageLogs and send pick individual messageLog so we can send message to each
            // person one by one
            console.log("iterating through message logs..");
            var messageLogsPromises = [];
            messageLogs.map(function (messageLog) {

                var fbDataPromise = null;

                if(fbSessionAPIBag[messageLog.senderFBId]) {
                    // we have cached this session id
                    console.log("using cached session api");
                    api = fbSessionAPIBag[messageLog.senderFBId];
                    fbDataPromise = Promise.resolve({
                        api: api,
                        messageLog: messageLog
                    });
                }
                else {
                    console.log("not cached session api. loading in memory now..");
                    fbDataPromise = FBUtils
                        .loadSession(messageLog.fbSessionApi)
                        .then(function (api) {
                            console.log("loaded session api for user: ", api.getCurrentUserID());
                            fbSessionAPIBag[messageLog.senderFBId] = api;
                            return {
                                api: api,
                                messageLog: messageLog
                            }
                        });
                }
                messageLogsPromises.push(fbDataPromise)
            });
            return messageLogsPromises;
        })
        .then(function(messageLogPromises){
            return Promise.all(messageLogPromises)
                .then(function(messageLogs){

                    var sendMessagePromises = [];

                    messageLogs.map(function(messageLogObj){
                        var api = messageLogObj.api;
                        var messageLog = messageLogObj.messageLog;
                        console.log("sending messages count: ", messageLog.sendToList.length );
                        messageLog.sendToList.map(function(sendTo){
                            console.log("sending message to: ", sendTo.receiverId);
                            var sendMsgPromise = FBUtils.sendMessage(api, sendTo.messageText, sendTo.receiverId)
                                .then(function(msgResult){
                                    /*
                                     userID: friend.userID,
                                     firstName: friend.firstName,
                                     success: true,
                                     err: null
                                     */
                                    console.log("result of send message: ", msgResult);
                                    FBMessageModel.logMessageResult({
                                            messageLog: messageLog,
                                            messageId: messageLog._id,
                                            receiverId: sendTo.receiverId,
                                            status: msgResult.success ? 2 : 3, // 2 for success, 3 for failure
                                            statusMsg: msgResult.msg
                                        })
                                        .then(function(){
                                            return msgResult;
                                        });
                                });
                            sendMessagePromises.push(sendMsgPromise);
                            return sendMsgPromise;
                        });

                    });

                    console.log("running messages.all on # ", sendMessagePromises.length);
                    return Promise
                        .all(sendMessagePromises)
                        .then(function(results){
                            console.log("completed all messages for ", results.length);
                            return results;
                        })
                })
        })
        .then(function(messageLogsPromiseResults){
            console.log("ran through all the message logs: ", messageLogsPromiseResults.length)
        })
        .catch(function(err){
            console.log("mega fail!! ", err.stack, err)
        })

};


mongoose.connection.on('connected', function () {
    sendMessages(1460191090375, 1460216290375)
        .then(function(d){
            console.log("sent", d);
        })
        .then(function(){
            //process.exit()
            console.log("ok");
        })
});


(function me(){
    setTimeout(function(){ me() }, 1000);
})()