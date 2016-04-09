/**
 * Created by haywire on 09/04/16.
 */

var fblogin = require('facebook-chat-api');
var bluebird  = require('bluebird');

var _ = require('lodash');

exports.loadSession = function(apiStr){
    return new Promise(function(resolve, reject) {
        console.log("loading app state from session");
        // else pick from the session
        //loginPromise = Promise.resolve(req.session.fb.api);
        fblogin({appState: JSON.parse(apiStr)}, function (err, api) {
            if (err || _.isEmpty(api)) {
                console.log("error loading app state: ", err);
                reject(err);
            }
            else {
                console.log("success loading app state.");
                api.setOptions({
                    forceLogin: true,
                    logLevel: 'verbose'
                });
                setTimeout(function(){
                    resolve(api);
                }, 1000);
            }
        })
    })
};

exports.sendMessage = function(api, msg, friendId){

    console.log("sending message to: ", typeof friendId, friendId);
    api.setOptions({
        logLevel: 'silly'
    });

    var sendMsgPromise = new Promise(function(resolve, reject){

        console.log("queuing message..");
        api.sendMessage({body: msg}, friendId, function(err, result){
            //console.log("sendMessage returned: ", err, result);
            if(err){
                console.log("error sending msg to", friendId, err);
                return resolve({
                    userID: friendId,
                    success: false,
                    msg: err.message
                });
            }
            else {
                console.log("success sending msg to", friendId, result);
                return resolve({
                    userID: friendId,
                    success: true,
                    msg: "success sending message"
                });
            }
        });
    });
    console.log("inner sendMsgPromise instance of Promise? ", sendMsgPromise instanceof Promise);
    sendMsgPromise.then(function(result){
        console.log("sendmessage.then: ", result);
        return result;
    });

    return sendMsgPromise;

};