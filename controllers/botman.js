/**
 * Created by haywire on 03/04/16.
 */

var fblogin = require('facebook-chat-api');
var _ = require('lodash');
var debug = require('debug');
//var Promise = require('bluebird');

exports.fbBot = function(req, res){
    if(_.isEmpty(req.body) || _.isEmpty(req.body.fbusername) || _.isEmpty(req.body.fbpass) || _.isEmpty(req.body.fbmsg)){
        renderPage(res, req.body);
        return;
    }

    // else the user has given username, password and message. Broadcast to his userbase.
    fblogin({email: req.body.fbusername, password: req.body.fbpass}, function(err, api) {
        if (err) {
            console.log("Oops! error fb login: ", err);
            renderPage(res, req.body);
            return;
        }
        debug("wow. im in.");
        api.getFriendsList(function(ferr, friendsList){
            if(ferr) {
                console.log("error getting friends list: ", ferr);
                renderPage(res, req.body);
                return
            }

            //var sendMessage = Promise.promisify(api.sendMessage);

            console.log("great got friends list: ", friendsList.length);
            var failedMsgs = [];
            var successMsgs = [];
            var msgPromises = [];

            friendsList.map(function(friend){

                var msg = "Hi "+friend.firstName+"! I'm just a testing bot. Please don't mind.. :)";
                if(req.body.message) msg = req.body.message;

                if(friend.userID) {
                    console.log("sending msg to: ", friend.userID);
                    successMsgs.push({
                        userID: friend.userID,
                        firstName: friend.firstName
                    });
                    var pr = new Promise(function(resolve, reject){
                        api.sendMessage(msg, friend.userID, function(err, result){
                            if(err){
                                reject(err);
                                return;
                            }
                            resolve(result);
                        });
                    });
                    msgPromises.push(pr);
                }
                else {
                    failedMsgs.push({
                        userID: friend.userID,
                        firstName: friend.firstName
                    });
                    console.log("not sending to: ", friend);
                }
            });

            Promise
                .all(msgPromises)
                .then(function(results){
                    console.log("success sending msgs");
                    renderPage(res, req.body, successMsgs, failedMsgs);
                })
                .catch(function(err){
                    console.log("error sending some message", err);
                    renderPage(res, req.body, successMsgs, failedMsgs);
                })

        })
    });
};

function renderPage(res, reqBody, successMsgs, failedMsgs){
    if(_.isEmpty(reqBody)) {
        res.render('fbbot', {
            title: 'Loki | The Facebook Bot',
            username: '',
            password: '',
            message: '',
            successMsgs: successMsgs ? JSON.stringify(successMsgs) : '',
            failedMsgs:  failedMsgs ? JSON.stringify(failedMsgs) : ''
        });
    }
    else {
        res.render('fbbot', {
            title: 'Loki | The Facebook Bot',
            username: reqBody.fbusername || '',
            password: reqBody.fbpass || '',
            message: reqBody.fbmsg || '',
            successMsgs: successMsgs ? JSON.stringify(successMsgs) : '',
            failedMsgs:  failedMsgs ? JSON.stringify(failedMsgs) : ''
        });
    }
}