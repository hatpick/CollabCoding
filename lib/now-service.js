/**
 * @author Soroush Hat
 */
module.exports = function() {
    var nowServer = {}, mongoose = require('mongoose');

    nowServer.nowjs = require('now');
    var connection = mongoose.connect('mongodb://localhost/collabcoding');
    nowServer.ThreadMessage = mongoose.model('ThreadMessage', new mongoose.Schema({
        messageId : String,
        messageSender : String,
        messageBody : String,
        messageTimestamp : Date,
        messageTSString : String,
        messageType : String
    }));

    /*nowServer.Notification = mongoose.model('Notification', new mongoose.Schema({
     notifId: String, notifOwner: String, notifBody: String, notifTimestamp: Date, notifTSString: String
     }));*/

    nowServer.online = 0;
    nowServer.users = {};

    nowServer.start = function(server) {
        var everyone = nowServer.nowjs.initialize(server);

        everyone.now.openProjectsList = {};

        everyone.now.sendMessage = function(message) {
            console.log("here " + this.now.projectGroup);
            var group = nowServer.nowjs.getGroup(this.now.projectGroup);
            var threadMsg = new nowServer.ThreadMessage();
            threadMsg.messageId = this.user.clientId;
            var ts = threadMsg.messageTimestamp = new Date();
            threadMsg.messageTSString = 'Sent on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
            threadMsg.messageBody = message;
            threadMsg.messageSender = this.now.name;
            threadMsg.save(function() {
                group.now.receiveMessage(threadMsg._doc);
            });
        };

        everyone.now.changeProjectGroup = function(newProjectGroup) {              
            var oldProjectGroup = this.now.projectGroup;     
            console.log("oldpname : " + oldProjectGroup);                                 
            if (typeof oldProjectGroup !== 'undefined') {                
                var oldGroup = nowServer.nowjs.getGroup(oldProjectGroup);
                console.log("1");
                oldGroup.removeUser(this.user.clientId);
                console.log("2");
                var notifTSString = ' has closed the project on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
                var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + this.now.name + '</a>' + notifTSString + '</span>';
                var ntfcn = {
                    text : notifMsg,
                    type : 'error',
                    senderId : this.user.clientId
                };
                //FIXME need refresh for user list in chat
                oldGroup.now.receiveNotification(ntfcn, false);
                console.log("3");                        
            }
            if(typeof newProjectGroup !== 'undefined') {
                console.log("1");
                var newGroup = nowServer.nowjs.getGroup(newProjectGroup);
                console.log("2");                
                newGroup.addUser(this.user.clientId);
                console.log("3");                
                
                var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + this.now.name + '</a> has opened <a href="#" class="notification-project-a">' + newProjectGroup + '</a></span>';
                var ntfcn = {
                    text : notifMsg,
                    type : 'success',
                    senderId : this.user.clientId
                };
                //FIXME need refresh for user list in chat
                console.log("4");
                newGroup.now.receiveNotification(ntfcn, false);
                console.log("5");
                this.now.projectGroup = newProjectGroup;     
                console.log("6");           
            }                      
        };

        everyone.now.sendNotification = function(notifMsg, notyType, needRefresh, type) {                            
            var ts = new Date();
            var notifTSString = 'Sent on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
            //TODO: add notification entity
            var ntfcn = {
                text : notifMsg,
                type : notyType,
                senderId : this.user.clientId
            };
            if(type == 'g' ) {
                console.log("Group Notification!");
                var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
                pg.now.receiveNotification(ntfcn, needRefresh);
            }
            else {
                console.log("Everyone Notification!");
                everyone.now.receiveNotification(ntfcn, needRefresh);                
            }
        };

        everyone.now.getHistory = function(callback) {
            nowServer.ThreadMessage.find().sort("messageTimestamp").exec(function(e, found) {
                callback(found);
            });
        };

    };

    return nowServer;
}();
