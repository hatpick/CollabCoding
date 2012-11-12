/*

 Copyright (c) 2009 Anant Garg (anantgarg.com | inscripts.com)

 This script may be used for non-commercial purposes only. For any
 commercial purposes, please contact the author at
 anant.garg@inscripts.com

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

 */

var windowFocus = true;
var username;
var chatHeartbeatCount = 0;
var minChatHeartbeat = 1000;
var maxChatHeartbeat = 33000;
var chatHeartbeatTime = minChatHeartbeat;
var originalTitle;
var blinkOrder = 0;

var chatboxFocus = new Array();
var newMessages = new Array();
var newMessagesWin = new Array();
var chatBoxes = new Array();

$(document).ready(function() {
    originalTitle = document.title;
    startChatSession();

    $([window, document]).blur(function() {
        windowFocus = false;
    }).focus(function() {
        windowFocus = true;
        document.title = originalTitle;
    });

    $.get('/user', function(user) {
        cs.setName(user.name);
    });

    //Chat
    cs = document.chatServer = {};   
    ns = document.notificationServer = {}; 

    cs.setName = function(name) {
        now.name = name;
        return false;
    };        

    cs.sendMessage = function(msgText) {
        now.sendMessage(msgText);
        return false;
    };
       
    now.receiveMessage = function(msg) {
        if($('#chatbox_Group').length == 0)
            chatWith("Group");
            //TODO set history        
        console.log(msg);
        var spanMsg = $('<div>').css({
            'margin' : '5px',
            '-webkit-border-radius' : '5px',
            'backgorund' : '#f5f5f5',
            'border' : '1px solid #e3e3e3'
        }).append($('<p>').css('margin', '5px').html($('<span>').css({
            'font-weight' : 'bold',
            'font-size' : '11px'
        }).html(msg.messageSender).append($('<span>').css({
            'font-weight' : 'normal',
            'font-size' : '12px'
        }).html(': ' + msg.messageBody))).append($('<p>').css({
            'font-size' : '10px',
            'text-align' : 'center',
            'margin-bottom' : '-2px'
        }).html(msg.messageTSString)));
        $('.chatboxcontent').append(spanMsg);
        $('#chatbox_Group .chatboxcontent').scrollTop($('#chatbox_Group .chatboxcontent')[0].scrollHeight);        
        var notification = noty({
            text : msg.messageSender + ' said: ' + msg.messageBody + '<br/>'+ msg.messageTSString,
            template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
            type : 'information',
            theme : 'defaultTheme',       
            dismissQueue: true,     
            layout: 'bottomLeft',
            timeout : 5000,
            closeWith : ['button'],
            buttons : false,
            callback: {
                afterClose: function() {
                    if(msg.messageId != now.core.clientId) {                    
                        var notifCount = parseInt($('.notification-count').html(), 10);                    
                        $('.notification-count').html(++notifCount).css('display','block');
                    }                                                                                               
                }
            }
        });
        var alert = document.getElementById("chatAlert");
        alert.play();      
    };        
    
    now.core.on('disconnect', function(){
        var notifMsg = now.name + " is offline!";
        ns.sendNotification(notifMsg, "error");
    });

    now.ready(function() {                 
        var notifMsg = now.name + " is online!";      
        ns.sendNotification(notifMsg, "success");            
    });    
});

function restructureChatBoxes() {
    align = 0;
    for (x in chatBoxes) {
        chatboxtitle = chatBoxes[x];

        if ($("#chatbox_" + chatboxtitle).css('display') != 'none') {
            if (align == 0) {
                $("#chatbox_" + chatboxtitle).css('right', '10px');
            } else {
                width = (align) * (225 + 7) + 10;
                $("#chatbox_" + chatboxtitle).css('right', width + 'px');
            }
            align++;
        }
    }
}

function chatWith(chatuser) {
    createChatBox(chatuser);
    $("#chatbox_" + chatuser + " .chatboxtextarea").focus();
}

function createChatBox(chatboxtitle, minimizeChatBox) {
    if ($("#chatbox_" + chatboxtitle).length > 0) {
        if ($("#chatbox_" + chatboxtitle).css('display') == 'none') {
            $("#chatbox_" + chatboxtitle).css('display', 'block');
            restructureChatBoxes();
        }
        $("#chatbox_" + chatboxtitle + " .chatboxtextarea").focus();
        return;
    }

    $(" <div />").attr("id", "chatbox_" + chatboxtitle).addClass("chatbox").html('<div class="chatboxhead"><div class="chatboxtitle">' + chatboxtitle + '</div><div class="chatboxoptions"><a href="javascript:void(0)" onclick="javascript:toggleChatBoxGrowth(\'' + chatboxtitle + '\')">_</a> <a href="javascript:void(0)" onclick="javascript:closeChatBox(\'' + chatboxtitle + '\')">x</a></div><br clear="all"/></div><div class="chatboxcontent"></div><div class="chatboxinput"><textarea class="chatboxtextarea" onkeydown="javascript:return checkChatBoxInputKey(event,this,\'' + chatboxtitle + '\');"></textarea></div>').appendTo($("body"));

    $("#chatbox_" + chatboxtitle).css('bottom', '20px');

    chatBoxeslength = 0;

    for (x in chatBoxes) {
        if ($("#chatbox_" + chatBoxes[x]).css('display') != 'none') {
            chatBoxeslength++;
        }
    }

    if (chatBoxeslength == 0) {
        $("#chatbox_" + chatboxtitle).css('right', '10px');
    } else {
        width = (chatBoxeslength) * (225 + 7) + 10;
        $("#chatbox_" + chatboxtitle).css('right', width + 'px');
    }

    chatBoxes.push(chatboxtitle);

    if (minimizeChatBox == 1) {
        minimizedChatBoxes = new Array();

        if ($.cookie('chatbox_minimized')) {
            minimizedChatBoxes = $.cookie('chatbox_minimized').split(/\|/);
        }
        minimize = 0;
        for ( j = 0; j < minimizedChatBoxes.length; j++) {
            if (minimizedChatBoxes[j] == chatboxtitle) {
                minimize = 1;
            }
        }

        if (minimize == 1) {
            $('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'none');
            $('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'none');
        }
    }

    chatboxFocus[chatboxtitle] = false;

    $("#chatbox_" + chatboxtitle + " .chatboxtextarea").blur(function() {
        chatboxFocus[chatboxtitle] = false;
        $("#chatbox_" + chatboxtitle + " .chatboxtextarea").removeClass('chatboxtextareaselected');
    }).focus(function() {
        chatboxFocus[chatboxtitle] = true;
        newMessages[chatboxtitle] = false;
        $('#chatbox_' + chatboxtitle + ' .chatboxhead').removeClass('chatboxblink');
        $("#chatbox_" + chatboxtitle + " .chatboxtextarea").addClass('chatboxtextareaselected');
    });

    $("#chatbox_" + chatboxtitle).click(function() {
        if ($('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display') != 'none') {
            $("#chatbox_" + chatboxtitle + " .chatboxtextarea").focus();
        }
    });

    $("#chatbox_" + chatboxtitle).show();
}

function chatHeartbeat() {

    var itemsfound = 0;

    if (windowFocus == false) {

        var blinkNumber = 0;
        var titleChanged = 0;
        for (x in newMessagesWin) {
            if (newMessagesWin[x] == true) {++blinkNumber;
                if (blinkNumber >= blinkOrder) {
                    document.title = x + ' says...';
                    titleChanged = 1;
                    break;
                }
            }
        }

        if (titleChanged == 0) {
            document.title = originalTitle;
            blinkOrder = 0;
        } else {++blinkOrder;
        }

    } else {
        for (x in newMessagesWin) {
            newMessagesWin[x] = false;
        }
    }

    for (x in newMessages) {
        if (newMessages[x] == true) {
            if (chatboxFocus[x] == false) {
                //FIXME: add toggle all or none policy, otherwise it looks funny
                $('#chatbox_' + x + ' .chatboxhead').toggleClass('chatboxblink');
            }
        }
    }
}

function closeChatBox(chatboxtitle) {
    $('#chatbox_' + chatboxtitle).css('display', 'none');
    restructureChatBoxes();
}

function toggleChatBoxGrowth(chatboxtitle) {
    if ($('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display') == 'none') {

        var minimizedChatBoxes = new Array();

        if ($.cookie('chatbox_minimized')) {
            minimizedChatBoxes = $.cookie('chatbox_minimized').split(/\|/);
        }

        var newCookie = '';

        for ( i = 0; i < minimizedChatBoxes.length; i++) {
            if (minimizedChatBoxes[i] != chatboxtitle) {
                newCookie += chatboxtitle + '|';
            }
        }

        newCookie = newCookie.slice(0, -1)

        $.cookie('chatbox_minimized', newCookie);
        $('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'block');
        $('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'block');
        $("#chatbox_" + chatboxtitle + " .chatboxcontent").scrollTop($("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);
    } else {

        var newCookie = chatboxtitle;

        if ($.cookie('chatbox_minimized')) {
            newCookie += '|' + $.cookie('chatbox_minimized');
        }

        $.cookie('chatbox_minimized', newCookie);
        $('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'none');
        $('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'none');
    }

}

function checkChatBoxInputKey(event, chatboxtextarea, chatboxtitle) {

    if (event.keyCode == 13 && event.shiftKey == 0) {
        message = $(chatboxtextarea).val();
        message = message.replace(/^\s+|\s+$/g, "");

        $(chatboxtextarea).val('');
        $(chatboxtextarea).focus();
        $(chatboxtextarea).css('height', '44px');
        if (message != '') {
            cs.sendMessage(message);
            message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
        }
        chatHeartbeatTime = minChatHeartbeat;
        chatHeartbeatCount = 1;

        return false;
    }

    var adjustedHeight = chatboxtextarea.clientHeight;
    var maxHeight = 94;

    if (maxHeight > adjustedHeight) {
        adjustedHeight = Math.max(chatboxtextarea.scrollHeight, adjustedHeight);
        if (maxHeight)
            adjustedHeight = Math.min(maxHeight, adjustedHeight);
        if (adjustedHeight > chatboxtextarea.clientHeight)
            $(chatboxtextarea).css('height', adjustedHeight + 8 + 'px');
    } else {
        $(chatboxtextarea).css('overflow', 'auto');
    }

}

function startChatSession() {
    //TODO: load history here
}

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

jQuery.cookie = function(name, value, options) {
    if ( typeof value != 'undefined') {// name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && ( typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if ( typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString();
            // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else {// only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}; 