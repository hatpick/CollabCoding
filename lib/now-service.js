/**
 * @author Soroush Hat
 */
module.exports = function() {
    var nowServer = {}, mongoose = require('mongoose');
    
    var hat = require('hat');
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
    
    nowServer.Comment = mongoose.model('Comment', new mongoose.Schema({
        commentId : String,
        commentSender : String,
        commentLineNumber : Number,
        commentBody : String,
        commentTimestamp : Date,
        commentTSString : String,
        commentType : String,
        commentPath : String,
        commentTaggedUsers : [String]
    }));
    
    nowServer.LockedCode = mongoose.model('LockedCode', new mongoose.Schema({
        lockedCodeId : String,
        lockedCodeOwner : String,
        lockedCodeFrom: {line: Number, ch: Number},
        lockedCodeTo: {line: Number, ch: Number},
        lockedCodeContent: String,
        lockedCodeTimestamp: Date,
        lockedCodeTSString : String,
        lockedCodePath : String        
    }));

    /*nowServer.Notification = mongoose.model('Notification', new mongoose.Schema({
     notifId: String, notifOwner: String, notifBody: String, notifTimestamp: Date, notifTSString: String
     }));*/

    nowServer.online = 0;        
    nowServer.users = {};
    nowServer.cursors = {};

    nowServer.start = function(server) {
        
        var everyone = nowServer.nowjs.initialize(server);
        everyone.now.openProjectsList = {};
        
        everyone.now.sendComment = function(comment) {
            //Database Comment
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            var cmnt = new nowServer.Comment();
            cmnt.commentId = comment.cid;
            cmnt.commentLineNumber = comment.line;
            cmnt.commentSender = comment.who;
            cmnt.commentBody = comment.content;
            cmnt.commentTimestamp = comment.timestamp;
            cmnt.commentTSString = comment.TSString;
            cmnt.commentPath = comment.path;            
            cmnt.commentTaggedUsers = comment.taggedUsers;
            comment.sid = this.user.clientId;
            
            var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + comment.who + '</a> added a <a class="notification-file-a"> comment </a>to <a href="#" class="notification-file-a">' + comment.path + '</a> file.</span>';
            var ntfcn = {
                text : notifMsg,
                type : 'information',
                senderId : this.user.clientId
            };
            
            cmnt.save(function(){                
                pg.now.receiveComment(comment, cmnt.commentId);                                                
                pg.now.receiveNotification(ntfcn, false);
            });                                                                                                               
        }
        
        everyone.now.sendLockedCode = function(lockedCode) {         
            //Database LockedCode
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            
            var lckdcde = new nowServer.LockedCode();
            lckdcde.lockedCodeId = lockedCode.lcid;
            lckdcde.lockedCodeOwner = lockedCode.who;
            lckdcde.lockedCodeFrom = lockedCode.from;
            lckdcde.lockedCodeTo = lockedCode.to;
            lckdcde.lockedCodeContent = lockedCode.content;
            lckdcde.lockedCodeTimestamp = lockedCode.timestamp;
            lckdcde.lockedCodeTSString = lockedCode.tsstring;
            lckdcde.lockedCodePath = lockedCode.path;                                                                                       
            
            var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + lockedCode.who + '</a> locked a portion of <a class="notification-file-a"> code </a>in <a href="#" class="notification-file-a">' + lockedCode.path + '</a> file.</span>';
            var ntfcn = {
                text : notifMsg,
                type : 'information',
                senderId : this.user.clientId
            };                            
            
            lckdcde.save(function(){
                pg.now.receiveLockedCode(lockedCode, ntfcn.senderId);
                pg.now.receiveNotification(ntfcn, false);                
            });                        
            //TODO: save in database this event           
        }
        
        everyone.now.syncCursors = function(cursor, uid) {            
            nowServer.cursors[uid] = cursor;                                                
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            //console.log(uid + " is currently at :" + cursor.line + " " + cursor.ch);
            pg.now.receiveCursors(nowServer.cursors);
        }                

        everyone.now.sendMessage = function(message) {            
            var group = nowServer.nowjs.getGroup(this.now.projectGroup);
            var threadMsg = new nowServer.ThreadMessage();
            threadMsg.messageId = this.user.clientId;
            var ts = threadMsg.messageTimestamp = new Date();
            threadMsg.messageTSString = 'Sent on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
            threadMsg.messageBody = message;
            threadMsg.messageSender = this.now.user.user;
            threadMsg.save(function() {
                group.now.receiveMessage(threadMsg._doc);
            });
        };              

        everyone.now.changeProjectGroup = function(newProjectGroup, hasVideo) {              
            var oldProjectGroup = this.now.projectGroup;
            var ts = new Date();
                        
            this.now.users = {};    
            if(nowServer.users[newProjectGroup] === undefined) {                
                nowServer.users[newProjectGroup] = [];                                                                
            }
                                                                  
                                                           
            if (typeof oldProjectGroup !== 'undefined') {                                                
                var oldGroup = nowServer.nowjs.getGroup(oldProjectGroup);
                oldGroup.removeUser(this.user.clientId);
                var notifTSString = ' has closed the project on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
                var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + this.now.user.user + '</a>' + notifTSString + '</span>';
                var ntfcn = {
                    text : notifMsg,
                    type : 'error',
                    senderId : this.user.clientId
                };                
                
                for(var index = 0; index < nowServer.users[oldProjectGroup].length; index++)
                    if(nowServer.users[oldProjectGroup][index].user === this.now.user.user) {
                        nowServer.users[oldProjectGroup].splice(index, 1);
                        break;                            
                    }                                        
                oldGroup.now.receiveNotification(ntfcn, false);
                oldGroup.now.updateList(nowServer.users);                       
            }
            if(newProjectGroup) {                
                var newGroup = nowServer.nowjs.getGroup(newProjectGroup);             
                newGroup.addUser(this.user.clientId);                               
                
                var notifMsg = '<span style="text-align:justify"><a class="notification-user-a">' + this.now.user.user + '</a> has opened <a href="#" class="notification-project-a">' + newProjectGroup + '</a></span>';
                var ntfcn = {
                    text : notifMsg,
                    type : 'success',
                    senderId : this.user.clientId
                };
                //FIXME need refresh for user list in chat
                if(nowServer.users[newProjectGroup].indexOf(this.now.user) === -1){
                    this.now.user.videoChat = hasVideo;
                    nowServer.users[newProjectGroup].push(this.now.user);
                }
                                        
                this.now.projectGroup = newProjectGroup;                
                newGroup.now.receiveNotification(ntfcn, false); 
                newGroup.now.updateList(nowServer.users);                             
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
                var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
                pg.now.receiveNotification(ntfcn, needRefresh);
            }
            else {                
                everyone.now.receiveNotification(ntfcn, needRefresh);                
            }
        };
        
        everyone.now.updateCurrentDoc = function(user, path) {
            var userList = nowServer.users[this.now.projectGroup];
            for(var i = 0;i < userList.length; i++){
                if(user === userList[i].user) {
                    var u = userList[i];
                    u.currentDocument = path;                                   
                    break;
                }
            }
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            pg.now.updateList(nowServer.users);                                                
        }
        
        everyone.now.startTransaction = function(path) {
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            pg.now.executePauseCommand(path, this.user.clientId);            
        }
        
        everyone.now.stopTransaction = function(path) {
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);
            pg.now.executeResumeCommand(path, this.user.clientId);            
        }
        
        
        
        /*everyone.now.sayHi = function (pname) {                
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);             
                                                                                    
        };
        
        everyone.now.sayBye = function (pname) {                                    
            var pg = nowServer.nowjs.getGroup(this.now.projectGroup);            
            pg.now.updateList();                              
        };*/

        everyone.now.getHistory = function(callback) {
            nowServer.ThreadMessage.find().sort("messageTimestamp").exec(function(e, found) {
                callback(found);
            });
        };                
    };

    return nowServer;
}();
