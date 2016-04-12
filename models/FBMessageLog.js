var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var moment = require('moment');
var mongoose = require('mongoose');
mongoose.set('debug', true);
var ObjectId = ObjectId = mongoose.Schema.Types.ObjectId;

/**
 *  MessagesLog
 *  {
 *   message: 'hello world',
 *   sender: xxxxx,
 *   sentToCount: 7,
 *   sentOn: Timestamp
 *  }
 *
 * DeliveryLog
 * {
 *    reciever: xxxx,
 *    sender: yyyyy,
 *    sentOn: xxxxx,
 *    status: pending/sent/failed,
 *    messageId:
 * }
 */

var DeliveryAttemptsSchema = new mongoose.Schema({
  timestamp: Date,
  message: String
});

var SendToSchema = new mongoose.Schema({
  receiverId: String,
  status: { type: Number, index: true },   // status 0: pending, 1 processing, 2 success, 3 error
  scheduledFor: { type: Date, default: Date.now, index: true },
  messageText: String,
  deliveryAttempts: { type: [DeliveryAttemptsSchema], required: false }
});


var MessageLogSchema = new mongoose.Schema({
  sender: { type: ObjectId, index: true },
  senderFBId: String,
  messageTemplate: String,
  sentToCount: Number,
  fbSessionApi: String,
  requestReceivedAt: { type: Date, default: Date.now },
  sendToList: [ SendToSchema ]
}, { timestamps: true });


MessageLogSchema.statics.findScheduledMessages = function(fromTimestamp, toTimestamp){
  console.log("Finding Scheduled Messages for: ", fromTimestamp,toTimestamp);
  console.log(this.find);
  return this.find({
          'sendToList.status': {$lt: 1},
          'sendToList.scheduledFor': {
            $gte: fromTimestamp, $lt: toTimestamp
          }
        },
        {
          //sender: 1,
          //senderFBId: 1,
          fbSessionApi: 1,
          sendToList: {
            $elemMatch: {
              'scheduledFor': {
                $gte: fromTimestamp, $lt: toTimestamp
              }
            }
          }
        }
  )
    .exec()
    .then(function(res){
      console.log("result: ", res.length);
      return res;
    })
};

/**
 *
 * @param objectIds
 * @returns mongo ObjectId or Array of ObjectIds
 */

MessageLogSchema.statics.toObjectId = function(objectIds){
  if(!objectIds.map){
    return new ObjectId(objectIds);
  }

  return objectIds.map(function(obId){
    return new ObjectId(obId);
  });
};

MessageLogSchema.statics.logMessageResult = function(logObj){
  return this.update({
    _id: logObj.messageId,
    sendToList: {
      $elemMatch: {
        receiverId: logObj.receiverId
      }
    }
  }, {
    $set: {
      "sendToList.$.status": logObj.status,
      $push: {
        "sendToList.$.deliveryLog": {
          message: logObj.msg,
          timestamp: (new Date()).getTime()
        }
      }
    }
  }).exec(function(err, result){
    console.log("logMessageResult:", err, result);
  })

};

/**
 *
 * @param objectIdsArr
 * @param fromTimestamp
 * @param toTimestamp
 * @returns {Array|{index: number, input: string}|Promise|any}
 */
MessageLogSchema.statics.lockMessages = function(objectIdsArr, fromTimestamp, toTimestamp){

  return this.update({
    sendToList: {
      $elemMatch: {
        status: { $lt: 1},
        scheduledFor: {
          $gte: (new Date(fromTimestamp)).getTime(),
          $lt: (new Date(toTimestamp)).getTime()
        }
      }
    }
  }, {
    "sendToList.$.status": 1
  }).exec()
};

var MessageLog = mongoose.model('MessageLog', MessageLogSchema);

module.exports = MessageLog;
