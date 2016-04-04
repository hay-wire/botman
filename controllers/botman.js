/**
 * Created by haywire on 03/04/16.
 */

var fblogin = require('facebook-chat-api');
var _ = require('lodash');
var debug = require('debug');
//var Promise = require('bluebird');
var apisBag = {};


exports.fbLogin = function(req, res){
    if(!_.isEmpty(req.session) && !_.isEmpty(req.session.fb) && _.isEmpty(req.session.fb.api)){
        console.log("already loggedin user..");
        res.redirect('/bot/fb/friends');
        return;
    }

    if (_.isEmpty(req.body) || _.isEmpty(req.body.fbusername) || _.isEmpty(req.body.fbpass)) {
        console.log("username or password missing");
        renderLoginPage(res, req.body, null, null, new Error("BOTMAN_EMPTY_FB_USERNAME_PASSWORD"));
    }
    else {
        console.log("logging in user..");
        fblogin({email: req.body.fbusername, password: req.body.fbpass}, function (err, api) {
            if (err) {
                console.log("Oops! error fb login: ", err);
                renderLoginPage(res, req.body);
                reject(err);
                return;
            }

            req.session.fb.username = req.body.fbusername;
            req.session.fb.password = req.body.fbpass;
            console.log("logged in.. redirecting..");
            if(_.isEmpty(req.session.fb)) req.session.fb = {};
            req.session.fb.api = api.getAppState();
            //console.log("got api:", api);
            res.redirect('/bot/fb/friends');
        });
    }
};

exports.showFriendsList = function(req, res) {
    if(_.isEmpty(req.session) || _.isEmpty(req.session.fb.username) || _.isEmpty(req.session.fb.api)){
        console.log("user not logged in..");
        res.redirect('/bot/fb/login');
        return;
    }


    if(!_.isEmpty(req.session.fb.friendList)){
        renderFriendsListPage(res, req.session.fb.username, req.session.fb.friendList);
        return;
    }

    new Promise(function(resolve, reject) {
        console.log("loading app state from session");
        // else pick from the session
        //loginPromise = Promise.resolve(req.session.fb.api);
        fblogin({appState: req.session.fb.api}, function (err, api) {
            if (err) {
                console.log("error loading app state: ", err);
                reject(err);
            }
            else {
                console.log("success loading app state.");
                resolve(api);
            }
        })
    })

    .then(function(api){
        console.log("getting friend list..");
        api.getFriendsList(function (ferr, friendsList) {
            if (ferr) {
                console.log("error getting friends list: ", ferr);
                renderLoginPage(res, req.body, null, null, ferr);
                return;
            }
            console.log("success getting friendslist: ", friendsList.length);
            req.session.fb.friendList = friendsList;
            renderFriendsListPage(res,  req.session.fb.username, friendsList);
        });
    })

};


exports.messageFriends = function(req, res){
    var fb = req.session.fb;
    if(_.isEmpty(fb)){
        renderLoginPage(res, req.body, null, null, new Error('BOTMAN_INVALID_USER_FB_SESSION'));
        return;
    }

    if(_.isEmpty(req.body.selectedFriendsList)){
        renderLoginPage(res, req.body, null, null, new Error('BOTMAN_NO_FRIEND_SELECTED_FOR_MSG'));
        return;
    }

    fb.getFriendsList(function(ferr, friendsList){
        if(ferr) {
            console.log("error getting friends list: ", ferr);
            renderLoginPage(res, req.body, null, null, ferr);
            return;
        }

        //var sendMessage = Promise.promisify(api.sendMessage);

        console.log("great got friends list: ", friendsList.length);
        var failedMsgs = [];
        var successMsgs = [];
        var msgPromises = [];

        friendsList.map(function(friend){

            var msg = "Hi "+friend.firstName+"! I'm a testing bot who your friend summoned. Find me on http://botman.prashantdwivedi.co :)";
            if(req.body.message) msg = parseMessage(req.body.message, friend);

            if(friend.userID) {
                console.log("sending msg to: ", friend.userID);
                var pr = new Promise(function(resolve, reject){
                    fb.sendMessage(msg, friend.userID, function(err, result){
                        if(err){
                            failedMsgs.push({
                                userID: friend.userID,
                                firstName: friend.firstName,
                                err: err
                            });
                        }
                        else {
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

        Promise
            .all(msgPromises)
            .then(function(results){
                console.log("success sending msgs");
                renderLoginPage(res, req.body, successMsgs, failedMsgs);
            })
            .catch(function(err){
                console.log("error sending some message", err);
                renderLoginPage(res, req.body, successMsgs, failedMsgs);
            })

    })

};



function parseMessage(msg, friend){
    var replacements = {
        '{name}': friend.firstName
    };

    for( var key in replacements){
        msg = msg.replace(new RegExp(key, 'g'), replacements[key]);
    }

    return msg;
}


function renderLoginPage(res, reqBody, successMsgs, failedMsgs, err){
    if(_.isEmpty(reqBody)) {
        res.render('fbbot', {
            title: 'Loki | The Facebook Bot',
            username: '',
            password: '',
            message: '',
            successMsgs: successMsgs ? JSON.stringify(successMsgs) : '',
            failedMsgs:  failedMsgs ? JSON.stringify(failedMsgs) : '',
            error: err || null
        });
    }
    else {
        res.render('fbbot', {
            title: 'Loki | The Facebook Bot',
            username: reqBody.fbusername || '',
            password: reqBody.fbpass || '',
            message: reqBody.fbmsg || '',
            successMsgs: successMsgs ? JSON.stringify(successMsgs) : '',
            failedMsgs:  failedMsgs ? JSON.stringify(failedMsgs) : '',
            error: err || null
        });
    }
}

function renderFriendsListPage(res, username, friendsList, successMsgs, failedMsgs, err){
    res.render('fbFriendsList', {
        title: 'FriendList | Loki | The Facebook Bot',
        fbUserName: username,
        friendsList: friendsList,
        successMsgs: successMsgs,
        failedMsgs: failedMsgs
    });

}
