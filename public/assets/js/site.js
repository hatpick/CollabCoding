var errBookmarks = [];
var commentBookmarks = [];
var errorIcons = [];
var widgets = [];
var markedText = [];
var sideComments = [];
var currentDocumentPath = '';

function updateHints(editor) {
    editor.operation(function() {
        for (var i = 0; i < errBookmarks.length; ++i) {
            $(errBookmarks[i].dom).remove();
        }
        editor.clearGutter("CodeMirror-errorGutter");
        errBookmarks.length = 0;
        errorIcons.length = 0;

        JSHINT(editor.getValue());
        for (var i = 0; i < JSHINT.errors.length; ++i) {
            var err = JSHINT.errors[i];
            if (!err)
                continue;
            var bm = addBookmarks("error", err.line, editor);
            $(bm.dom).tooltip({
                title : err.line + ": " + err.reason,
                placement : "left"
            });
            //addGutterError(err.line, editor);
        }
    });
}

function saveCodeXML(editor) {
    if (currentDocumentPath === '')
        return;
    var xmlDoc = codeToXML(editor);
    console.log(xmlDoc)
    var project_name = sessionStorage.getItem('project');
    var url = '/project/' + project_name + '/saveXML';
    var sid = sessionStorage.getItem("docName"); 
    
    console.log(url + " sid:" + sid);   

    $.post(url, {
        "owner" : now.user.user,
        "snapshot" : xmlDoc,
        "path" : currentDocumentPath,
        "shareJSId": sid,
        "timestamp": new Date()
    }, function(error, cs) {
        if(error)
            console.log(error);
        else{
            console.log(cs);
        }
    }, 'json');
}

function lockCode(cm) {
    if (cm.somethingSelected()) {
        var from = cm.view.sel.from;
        var to = cm.view.sel.to;
        var mt = cm.markText(from, to, {
            className : "gooz",
            readOnly : true
        });
        $.each(mt.lines, function(i, line) {
            cm.addLineClass(line, "wrap", "lockedCodeMarker");
        });
        markedText.push(mt);
        cm.setCursor(from);
    }
}

function arian(string, context) {
    return string.replace(/%\(\w+\)s/g, function(match) {
        return context[match.slice(2, -2)];
    });
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
function escapeHTML(text) {
    var esc = text;
    var re = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"]];
    for (var i = 0, len = re.length; i < len; i++) {
        esc = esc.replace(re[i][0], re[i][1]);
    }
    return esc;
}

function listOptions(els, opts) {
    var str = "/*jshint ";
    for (var name in opts) {
        if (opts.hasOwnProperty(name)) {
            str += name + ":" + opts[name] + ", ";
        }
    }
    str = str.slice(0, str.length - 2);
    str += " */";
    els.append(str);
}

function editor(id, mode) {
    var _editor = CodeMirror.fromTextArea(id, {
        mode : mode,
        lineNumbers : true,
        lineWrapping : true,
        extraKeys : {
            "'>'" : function(cm) {
                cm.closeTag(cm, ">");
            },
            "'/'" : function(cm) {
                cm.closeTag(cm, "/");
            },
            "Ctrl-Space" : "autocomplete"
        },
        syntax : "html",
        matchBrackets : true,
        profile : "xhtml",
        onKeyEvent : function() {
            return zen_editor.handleKeyEvent.apply(zen_editor, arguments);
        },
        gutters : ["CodeMirror-commentsGutter", "CodeMirror-commentsiconsGutter", "CodeMirror-errorGutter", "CodeMirror-linenumbers"]
    });

    Inlet(_editor);

    return _editor;
}

function clearMarker(cm, type) {
    if (type === 'error') {
        $.each(errBookmarks, function(i, errBookmark) {
            cm.removeLineClass(errBookmark.line - 1, "wrap", "errorMarker");
        });
    } else if (type === 'comment') {
        $.each(commentBookmarks, function(i, commentBookmark) {
            cm.removeLineClass(commentBookmark.line - 1, "wrap", "commentMarker");
        });
    }
}

function addGutterError(dln, cm) {
    var errorMarker;
    var errorMarkerDom = $("<span>").addClass('CodeMirror-erroriconGutter').text("●");
    cm.setGutterMarker(dln - 1, "CodeMirror-errorGutter", $(errorMarkerDom).get(0));

    errorMarker.dom = errorMarkerDom;
    errorMarker.line = dln;

    errorIcons.push(errorMarker);
}

function _sortByLine(a, b) {
    var lineA = a.line;
    var lineB = b.line;

    return ((lineA < lineB) ? -1 : ((lineA > lineB) ? 1 : 0));
}

function _wherebookmark(dln) {
    var allBookmarks = errBookmarks.concat(commentBookmarks);
    allBookmarks = allBookmarks.sort(_sortByLine);

    for (var i = 0; i < allBookmarks.length; i++) {
        bkmrk = allBookmarks[i];
        if (bkmrk.line > dln) {
            if (i === 0)
                return i;
            return i;
        }
    }
    return -1;
}

function addBookmarks(type, dln, cm) {
    var marker, className, bookmarks;
    var bookmarkHeight = $("#bookmarksArea").height();
    var editorHeight = myCodeMirror.lineCount();
    var mapPers;
    if (editorHeight * 14 > bookmarkHeight * 2)
        mapPers = (bookmarkHeight) / (editorHeight);
    else
        mapPers = (editorHeight * 14) / (bookmarkHeight);

    var top = mapPers * (dln);

    if (type === 'error') {
        bookmarks = errBookmarks;
        className = "CodeMirror-bookmarksIconError";
        marker = "errorMarker";
    } else if (type === 'comment') {
        bookmarks = commentBookmarks;
        marker = "commentMarker";
        className = "CodeMirror-bookmarksIconComment";
    }
    var bookmark = $("<div>").addClass(className).attr("data-line", dln).css("top", top).click(function() {
        var line = $(this).attr("data-line") - 1;
        clearMarker(cm, type);
        cm.addLineClass(line, "wrap", marker);
        cm.setCursor({
            line : line,
            ch : 0
        });
    });

    var bookmarkObj = {
        line : (dln),
        dom : bookmark,
        type : type
    };
    var index = _wherebookmark(dln);
    if (index !== -1 && type === 'comment')
        $("#bookmarksArea div:nth-child(" + index + ")").after(bookmark);
    else
        $("#bookmarksArea").append(bookmark);
    bookmarks.push(bookmarkObj);
    return bookmarkObj;
}

function codeToXML(editor) {
    var codeHTML = [];

    var rootDocument = $("<code>").attr("id", currentDocumentPath);
    var codeDocument = editor.view.doc;
    codeDocument.iter(0, codeDocument.size, function(line) {
        codeHTML.push(line);
    });

    for (var index = 0; index < codeHTML.length; ) {
        var codeLine = codeHTML[index];
        if ( typeof codeLine.wrapClass !== 'undefined') {
            switch(codeLine.wrapClass) {
                case 'commentMarker commentMarkerInvisible':
                    var cid = '';
                    var commentNode = $("<comment>").attr("id", cid).append($("<l>").text(codeLine.text));
                    index++;

                    $(rootDocument).append(commentNode);
                    break;
                case 'commentMarkerInvisible':
                    var cid = '';
                    var commentNode = $("<comment>").attr("id", cid).text(codeLine.text);
                    index++;

                    $(rootDocument).append(commentNode);
                    break;
                case 'lockedCodeMarker':
                    var lockedCodeNode = $("<lockedCode>");
                    var codeText = "";
                    var j = index, tempLine = codeLine;
                    while (tempLine.wrapClass === 'lockedCodeMarker') {
                        $(lockedCodeNode).append($("<l>").text(tempLine.text));
                        j++;
                        if (j < codeHTML.length)
                            tempLine = codeHTML[j];
                        else
                            break;
                    }
                    index = j;

                    $(rootDocument).append(lockedCodeNode);
                    break;
            }
        } else {
            var pureCodeNode = $("<pureCode>");
            var codeText = "";
            var j = index, tempLine = codeLine;
            while ( typeof tempLine.wrapClass === 'undefined') {
                $(pureCodeNode).append($("<l>").text(tempLine.text));
                j++;
                if (j < codeHTML.length)
                    tempLine = codeHTML[j];
                else
                    break;
            }
            index = j;

            $(rootDocument).append(pureCodeNode);
        }
    }
    console.log($(rootDocument)[0].outerHTML);
    return $(rootDocument)[0].outerHTML;
}

function reportFailure(report, cm) {
    var errors = $("#small-console div");
    var item;
    errors[0].innerHTML = "";
    errors.append(arian(editorMessage.errorMessage, {
        message : "JSHint has found " + report.errors.length + " potential problems in your code."
    }));
    for (var i = 0, err; err = report.errors[i]; i++) {
        if (!err.scope || err.scope === "(main)") {
            errors.append(arian('<li><p>' + templates.error + '</p></li>', {
                line : err.line,
                code : err.evidence ? escapeHTML(err.evidence) : '&lt;no code&gt;',
                msg : err.reason
            }));
            // var bm = addBookmarks("error", err.line, cm);
            // $(bm.dom).tooltip({title: err.reason, placement: "left"});
        } else {
            errors.append(arian("<li><p>" + templates.error + "</p></li>", {
                line : err.line,
                character : err.character,
                code : $.trim(err.evidence) ? $.trim(escapeHTML(err.evidence)) : "",
                msg : err.reason
            }));
            // var bm = addBookmarks("error", err.line, cm);
            // $(bm.dom).tooltip({title: err.reason, placement: "left", delay: {show: 100, hide: 500}});
        }
        $("a[data-line=" + err.line + "]").bind("click", function(ev) {
            var line = $(this).attr("data-line") - 1;
            var str = cm.getLine(line);
            cm.setSelection({
                line : line,
                ch : 0
            }, {
                line : line,
                ch : str.length
            });
            scrollTo(0, 0);
        });
    }
    $("#small-console").append(errors);
    $("#small-console").toggleClass("small-console-animated");
}

function reportSuccess(report) {
    var success = $("#small-console div");
    success[0].innerHTML = "";
    success.append(arian(editorMessage.successMessage, {
        message : "Good job! JSHint hasn't found any problems with your code."
    }));
    $("#small-console").append(success);
    $("#small-console").toggleClass("small-console-animated");
}

// function randomDocName (length) {
//   var chars, x;
//   if (!length) {
//     length = 10;
//   }
//   chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-=";
//   var name = [];
//   for ( x = 0; x < length; x++) {
//     name.push(chars[Math.floor(Math.random() * chars.length)]);
//   }
//   return name.join("");
// };

var cmPosition = {};

var templates = {
    error : '<a style="text-decoration:none;" data-line="%(line)s" href="javascript:void(0)">Line %(line)s, Character %(character)s</a>: ' + '<code>%(code)s</code><p style="color: #b94a48">%(msg)s</p>'
};

var editorMessage = {
    errorMessage : '<p style="color:#E62E00; text-align=center;">%(message)s</p>',
    successMessage : '<p style="color:#009933; text-align=center;">%(message)s</p>'
};

$.fn.usedWidth = function() {
    return $(this).width() + parseInt($(this).css("margin-left"), 10) + parseInt($(this).css("margin-right"), 10);
};

$.fn.usedHeight = function() {
    return $(this).height() + parseInt($(this).css("margin-top"), 10) + parseInt($(this).css("margin-bottom"), 10);
};

var layout = function() {
    var _height = document.documentElement.clientHeight - $(".navbar").height() - 20;
    $("#chatArea>table>tbody>tr:first").height(_height - 160);
    $("#editor-area").height(_height);
    $("#left-items").height(_height);
    $(".left-splitter").height(_height);
    $(".left-splitter-collapse-button").css("margin-top", _height / 2);
    $(".tab-pane").css("height", "100%");
    $("#right-items").height(_height - 52);
    $("#right-items>div").height(_height - 52);
    $("#editor-area").css("left", $(".left-splitter").position().left + $(".left-splitter").usedWidth());
    $("#editor-area").css("width", document.documentElement.clientWidth - 10 - ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) - $(".left-splitter").usedWidth() - 15);

    if ($("#left-items").is(":visible")) {
        $("#right-items").css("left", $("#left-items").usedWidth() + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
        $("#right-items").css("width", 15);
    } else {
        $("#right-items").css("left", $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
    }

    _height = $("#left-items").height() - $("#nav-tab").height() - parseInt($("#nav-tab").css("margin-bottom"), 10);
    $(".tab-content").height(_height);
    // _height = document.documentElement.clientHeight - $(".navbar").height() - 20;
    $(".CodeMirror-wrap").height($("#project").height());
    if ($("button[data-action=editor-livepreview-toggle]").attr("data-status") === "on") {
        $("#live_preview_window").height($("#project").height());
        //TODO change width of editor, preview window
    }

};

$(window).resize(function() {
    layout();
    if ( typeof myCodeMirror !== 'undefined')
        myCodeMirror.refresh();
});

window.onbeforeunload = function(e) {     
    _logout({"reason": "windowClose"});               
};

var idleModal;

$(document).ready(function() {
    sessionStorage.clear();
    window.doc = null;
    window.pid = null;
    // TODO
    _hotkeysHandler();
    //15 minutes idle
    startIdleTimer(900);

    //Notification Setup

    var editor_contextmenu = [{
        'Add Comment' : {
            onclick : function(menuItem, menu) {
                // alert("You clicked me!");
                // var cursor = myCodeMirror.getCursor();
                // var line = cursor.line;
                // var ch = cursor.ch;
                var cursor = myCodeMirror.coordsChar(cmPosition);

                createComment(cursor.line + 1, null, "You");
            },
            icon : "assets/img/comments-icon.png"
        },
        'Lock Code' : {
            onclick : function(menuItem, menu) {
                lockCode(myCodeMirror);
            },
            icon : "assets/img/code-lock.png"
        }
    }];
    ns.sendNotification = function(notyMsg, notyType, needRefresh, type) {
        now.sendNotification(notyMsg, notyType, needRefresh, type);
        return false;
    }

    now.receiveNotification = function(notyObj, needRefresh) {
        if (notyObj.senderId === now.core.clientId)
            return;
        var ntfcn = noty({
            text : notyObj.text,
            template : '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
            type : notyObj.type,
            dismissQueue : true,
            layout : 'bottomLeft',
            timeout : 5000,
            closeWith : ['button'],
            buttons : false,
        });

        if (needRefresh)
            refreshProjectTree();
    }

    now.receiveComment = function(comment, sid) {
        if (sid === now.core.clientId)
            return;
        if (currentDocumentPath === comment.path) {
            appendComment(comment);
        }
    }
    /*$(".CodeMirror-lines").resize(function(e) {
     var _height = $(".CodeMirror").height();
     var realHeight = parseInt($(".CodeMirror-scroll>div").css("min-height").substring(0, $(".CodeMirror-scroll>div").css("min-height").length - 2), 10);
     (realHeight > _height) ? $("#editor-comment-area").height(realHeight) : $("#editor-comment-area").height(_height);
     });*/

    function getFilePath(paths) {
        var currentdocumentpath = '';
        $.each(paths, function(i, doc) {
            currentdocumentpath += doc + '*';
        });
        return currentdocumentpath.substring(0, currentdocumentpath.length - 1);
    }


    $('#browser').bind('click', function() {
        //TODO save current document in database
        var reg = /^file.*/;

        if (reg.test($.jstree._focused().get_selected().attr('rel'))) {
            var file_type = $.jstree._focused().get_selected().attr('rel');
            var mode = "text/html";
            if (file_type === "file-js")
                mode = "javascript";
            else if (file_type === "file-css")
                mode = "css"

            //enable live preview toggle button, hide live view if open
            //TODO: hide live view

            $('.breadcrumb').empty();
            var paths = $.jstree._focused().get_path();
            var li;
            currentDocumentPath = getFilePath(paths);
            for (var i = 0; i < paths.length - 1; i++) {
                li = $('<li>').append($('<a>').attr('href', '#').html(paths[i]).click(function() {
                    $.jstree._reference('#browser').select_node($('#' + $(this).text() + '_id'), true);
                })).append('<span class="divider">/</span>');
                $('.breadcrumb').append(li);
            }
            li = $('<li>').addClass('active').html(paths[i]);
            $('.breadcrumb').append(li);
            var elem = document.getElementById('home');
            var myCodeMirror = editor(elem, mode);
            var docName = $.jstree._focused().get_selected().attr('data-shareJSId');
            sessionStorage.setItem("docName", docName);
            //CodeMirror.commands.selectAll(myCodeMirror);
            sharejs.open(docName, 'text', function(error, newdoc) {
                if (doc !== null) {
                    doc.close();
                    doc.detach_codemirror();
                };

                doc = newdoc;

                if (error) {
                    console.error(error);
                    return;
                }

                doc.attach_codemirror(myCodeMirror);
            });
            if ($(".CodeMirror.CodeMirror-wrap").size() > 1) {
                $($(".CodeMirror.CodeMirror-wrap")[1]).remove();
            }
            $(".CodeMirror-wrap").height($("#project").height());

            $(".CodeMirror-lines").mousedown(function(e) {
                if (e.which === 3) {
                    cmPosition.left = e.clientX;
                    cmPosition.top = e.clientY;
                }
            });

            $(".CodeMirror-lines").contextMenu(editor_contextmenu, {
                theme : 'vista'
            });

            $("#right-items").css("display", "block");
            $("#right-items>div").html("");

            var user = username;
            user.currentDocument = currentDocumentPath.replace(/\*/g, '/');
            now.updateCurrentDoc(username, user.currentDocument);

            if (file_type === "file-js") {
                var waitingLint;
                myCodeMirror.on('change', function(cm) {
                    clearTimeout(waitingLint);
                    waitingLint = setTimeout(updateHints(cm), 300);                    
                });
            }

            //TODO resize SynchDivScroll
            /*$(".CodeMirror-scrollbar").attr("id", "syncOneDive");
            new SynchDivScroll('syncOneDive', 'editor-comment-temp');

            $(".CodeMirror-lines").resize(function(e) {
            var _height = $(".CodeMirror").height();
            var realHeight = parseInt($(".CodeMirror-scroll>div").css("min-height").substring(0, $(".CodeMirror-scroll>div").css("min-height").length - 2), 10);
            (realHeight > _height) ? $("#editor-comment-area").height(realHeight) : $("#editor-comment-area").height(_height);
            });*/

            // mongoDB
            // $.get('/project/' + sessionStorage.getItem('project') + '/' + docName, function(data) {
            //         console.log('find the content');
            //         console.log(data);
            //         if (!data) {
            //           $.post('/project/syncToMongo', {
            //             shareJSId: docName,
            //             content: myCodeMirror.getValue(),
            //             timestamp: (new Date()).getTime()
            //           }, function(_data) {
            //             console.log('save a new document')
            //             console.log(_data);
            //           }, 'json');
            //         } else {
            //           myCodeMirror.setValue(data.content);
            //         }
            //       });
            //       pid = window.setInterval(function() {
            //         console.log('test')
            //       }, 5000);
            window.myCodeMirror = myCodeMirror;
            if (file_type === 'file-html') {
                _switchLiveViewButton(true);
            } else {
                _switchLiveViewButton(false);
            }
            _toggleLiveView(false);
        }
    });

    function _createJsTree(tree_data) {
        $("#browser").jstree({
            "unique" : {
                "error_callback" : function(n, p, f) {
                    alert("Duplicate node \"" + n + "\"!");
                }
            },
            select_node : true,
            json_data : {
                data : tree_data,
                progressive_render : true
            },
            types : {
                valid_children : ["root"],
                types : {
                    root : {
                        icon : {
                            image : "assets/img/project.png"
                        },
                        valid_children : ["file-html", "file-js", "file-css", "folder-html", "folder-css", "folder-js", "folder"],
                    },
                    "file-html" : {
                        valid_children : "none",
                        icon : {
                            image : "assets/img/file-html.png"
                        }
                    },
                    "file-js" : {
                        valid_children : "none",
                        icon : {
                            image : "assets/img/file-js.png"
                        }
                    },
                    "file-css" : {
                        valid_children : "none",
                        icon : {
                            image : "assets/img/file-css.png"
                        }
                    },
                    folder : {
                        valid_children : ["file-html", "file-js", "file-css", "folder-html", "folder-css", "folder-js", "folder"],
                        icon : {
                            image : "assets/img/folder.png"
                        }
                    },
                    "folder-html" : {
                        valid_children : ["file-html", "file-js", "file-css", "folder"],
                        icon : {
                            image : "assets/img/folder-html.png"
                        }
                    },
                    "folder-css" : {
                        valid_children : ["file-html", "file-js", "file-css", "folder"],
                        icon : {
                            image : "assets/img/folder-css.png"
                        }
                    },
                    "folder-js" : {
                        valid_children : ["file-html", "file-js", "file-css", "folder"],
                        icon : {
                            image : "assets/img/folder-js.png"
                        }
                    }
                }
            },
            plugins : ["themes", "json_data", "contextmenu", "types", "crrm", "ui", "unique", 'search'],
            contextmenu : {
                select_node : true,
                items : function(node) {
                    var re = /^file.*/;
                    return {
                        create : {
                            separator_before : false,
                            separator_after : true,
                            label : "New",
                            action : false,
                            "_disabled" : (re.test($(node).attr('rel'))),
                            submenu : {
                                file : {
                                    separator_before : false,
                                    separator_after : false,
                                    label : "File",
                                    action : function(obj) {
                                        createFile(obj);
                                        //this.create(obj);
                                    }
                                },
                                folder : {
                                    separator_before : false,
                                    icon : false,
                                    separator_after : false,
                                    label : "Folder",
                                    action : function(obj) {
                                        createFolder(obj);
                                        //this.create(obj);
                                    }
                                }
                            }
                        },
                        rename : {
                            separator_before : false,
                            separator_after : false,
                            label : "Rename",
                            action : function(obj) {
                                this.rename(obj, function(obj) {
                                    var project_name = sessionStorage.getItem('project');
                                    $.post('/project/' + project_name + '/rename', {
                                        old_name : obj.old_name,
                                        new_name : obj.new_name
                                    }, function(data) {
                                    }, 'json');
                                });
                            }
                        },
                        remove : {
                            separator_before : false,
                            icon : false,
                            separator_after : false,
                            label : "Delete",
                            action : function(obj) {
                                deleteElement(obj);
                                if (this.is_selected(obj)) {
                                    this.remove();
                                } else {
                                    this.remove(obj);
                                }
                            }
                        }
                    };
                }
            }
        });

        // $("#browser").on('a', 'contextmenu', function() {
        //    $("#browser").jstree('select_node', this);
        // });
    }

    function createNewJsTree(project_name) {
        var tree_data = {
            attr : {
                rel : 'root'
            },
            data : project_name,
            children : [{
                data : "html",
                attr : {
                    rel : "folder-html"
                }
            }, {
                data : "css",
                attr : {
                    rel : "folder-css"
                }
            }, {
                data : "js",
                attr : {
                    rel : "folder-js"
                }
            }, {
                data : "index.html",
                attr : {
                    rel : "file-html"
                }
            }],
            state : "open"
        };
        _createJsTree(tree_data);
    }

    function createJsTreeByJSON(_data) {
        var rel, ele, reg;
        var tree_data = {
            attr : {
                rel : 'root',
                id : _data.name + '_id'
            },
            data : _data.name,
            children : [],
            state : "open"
        };

        for (var key in _data.root) {
            if (key !== 'files') {
                if (key == 'html' || key == 'css' || key == 'js')
                    rel = 'folder-' + key;
                else
                    rel = 'folder';
                var folder = {
                    data : key,
                    attr : {
                        rel : rel,
                        id : key + '_id'
                    },
                    children : [],
                    state : "open"
                };
                for (var i = 0; i < _data.root[key].length; i++) {
                    ele = _data.root[key][i];
                    if (ele != null) {
                        if (ele.type == 'file') {
                            folder.children.push(_generateFileChildren(ele));
                        } else {
                            folder.children.push({
                                data : ele.name,
                                attr : {
                                    rel : 'folder',
                                    id : ele.name + '_id'
                                },
                                children : _generateChildren(ele.children),
                                state : "open"
                            });
                        }
                    }
                }
                tree_data.children.push(folder);
            } else {
                for (var i = 0; i < _data.root[key].length; i++) {
                    ele = _data.root[key][i];
                    tree_data.children.push(_generateFileChildren(ele));
                }
            }

        }
        _createJsTree(tree_data);
    }

    function _generateFileChildren(ele) {
        var reg, rel;
        reg = /.+\.html/;
        if (reg.test(ele.name)) {
            rel = 'file-html';
        } else {
            reg = /.+\.css/;
            if (reg.test(ele.name)) {
                rel = 'file-css';
            } else {
                rel = 'file-js';
            }
        }
        return {
            data : ele.name,
            attr : {
                rel : rel,
                id : ele.name + '_id',
                'data-shareJSId' : ele.shareJSId
            }
        };
    };

    function _generateChildren(folder) {
        var ele;
        var children = [];
        for (var i = 0; i < folder.length; i++) {
            ele = folder[i];
            if (ele.type == 'file') {
                reg = /.+\.html/;
                if (reg.test(ele.name)) {
                    rel = 'file-html';
                } else {
                    reg = /.+\.css/;
                    if (reg.test(ele.name)) {
                        rel = 'file-css';
                    } else {
                        rel = 'file-js';
                    }
                }
                children.push({
                    data : ele.name,
                    attr : {
                        rel : rel,
                        id : ele.name + '_id',
                        'data-shareJSId' : ele.shareJSId
                    }
                });
            } else {
                children.push({
                    data : ele.name,
                    attr : {
                        rel : 'folder',
                        id : ele.name + '_id'
                    },
                    children : _generateChildren(ele.children),
                    state : "open"
                });
            }
        }
        return children;
    };

    function checkQuality() {
        var options = {
            debug : true,
            forin : true,
            eqnull : true,
            noarg : true,
            noempty : true,
            eqeqeq : true,
            boss : true,
            loopfunc : true,
            evil : true,
            laxbreak : true,
            bitwise : true,
            strict : false,
            undef : true,
            curly : true,
            nonew : true,
            browser : true,
            devel : false,
            jquery : true,
            es5 : false,
            node : true
        };
        if (JSHINT(myCodeMirror.getValue(), options))
            reportSuccess(JSHINT.data());
        else
            reportFailure(JSHINT.data(), myCodeMirror);
        showConsole($("#small-console a"));
    }

    function showConsole(consoleToggle) {
        $("#small-console").css({
            bottom : 180,
            height : 200
        });
        $(consoleToggle).attr("href", "#hide");
        $("a[data-action=editor-console-toggle]").data("tooltip").options.title = "Hide Console";
        $("a[data-action=editor-console-toggle] i").attr("class", "icon-chevron-down icon-white pull-right");
        var _div = $("#small-console div").css({
            display : "block",
            position : "relative",
            "overflow-y" : "scroll",
            "-webkit-transition" : "all .5s ease",
            background : "-webkit-linear-gradient(top, rgba(242,242,242,1) 0%,rgba(193,193,189,1) 100%)",
            "padding-left" : "25px",
            "padding-top" : "5px",
            "margin-left" : "25px",
            "margin-right" : "-20px",
            height : 180,
            top : 20,
            opacity : .85
        });
        $("#small-console").toggleClass("small-console-animated");
    }

    function hideConsole(consoleToggle) {
        $("a[data-action=editor-console-toggle]").data("tooltip").options.title = "Show Console";
        $("#small-console").css({
            bottom : 0
        });
        $(consoleToggle).attr("href", "#show");
        $("a[data-action=editor-console-toggle] i").attr("class", "icon-chevron-up icon-white pull-right");
    }

    function getSelectedRange() {
        return {
            from : myCodeMirror.getCursor(true),
            to : myCodeMirror.getCursor(false)
        };
    }

    function autoFormatCode() {
        if (!myCodeMirror.somethingSelected()) {
            var lineCount = myCodeMirror.lineCount();
            var lastLineLength = myCodeMirror.getLine(lineCount - 1).length;
            myCodeMirror.setSelection({
                line : 0,
                ch : 0
            }, {
                line : lineCount,
                ch : lastLineLength
            });
        }
        var range = getSelectedRange();
        myCodeMirror.autoFormatRange(range.from, range.to);
    }

    function commentSelection(isComment) {
        var range;
        if (myCodeMirror.somethingSelected()) {
            if (isComment) {
                range = getSelectedRange();
                myCodeMirror.commentRange(isComment, range.from, range.to);
            } else {
                var selectedText = myCodeMirror.getSelection();
                if (/<!--[\s\S]*?-->/g.test(myCodeMirror.getSelection()) || /\/\*([\s\S]*?)\*\//g.test(myCodeMirror.getSelection())) {
                    range = getSelectedRange();
                    myCodeMirror.commentRange(false, range.from, range.to);
                } else {
                    var uncomment_error = $("#small-console div");
                    uncomment_error[0].innerHTML = "";
                    uncomment_error.append(arian(editorMessage.errorMessage, {
                        message : "Selected text is not a comment to be uncommented. Please select a commented text block to uncomment."
                    }));
                    $("#small-console").toggleClass("small-console-animated");
                    showConsole($("a[data-action=editor-console-toggle]"));
                }
            }
        } else {
            var comment_error = $("#small-console div");
            comment_error[0].innerHTML = "";
            if (isComment)
                comment_error.append(arian(editorMessage.errorMessage, {
                    message : "Please select uncommented text you want to comment."
                }));
            else
                comment_error.append(arian(editorMessage.errorMessage, {
                    message : "Please select commented text you want to uncomment."
                }));
            $("#small-console").toggleClass("small-console-animated");
            showConsole($("a[data-action=editor-console-toggle]"));
        }
    }

    function deleteElement(ele) {
        var project_name = sessionStorage.getItem('project');
        var id = $.jstree._focused().get_selected().attr('data-sharejsid');
        var paths = $.jstree._focused().get_path();
        $.post('/project/' + project_name + '/' + id + '/delete', {
            paths : paths,
            type : 'file'
        }, function() {
        }, 'json');
        //refreshProjectTree();
    }

    function createFile(ele) {
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New File</p>";
        var selectContent = $("<p>").append($("<select>").append('<option><a href="#"></a></option>').append('<option value=".html"><a href="#">HTML</a></option>').append('<option value=".js"><a href="#">JavaScript</a></option>').append('<option value=".css"><a href="#">CSS</a></option>').change(function() {
            $("div input").val($("select option:selected").val());
            $("div input").focus();
            $("div input")[0].setSelectionRange(0, 0);
        })).append($("<p>").append($("<input>").attr({
            type : "text",
            placeholder : "Enter file name",
            width : "100%",
            required : true
        })));
        var dialogContent = $("<div>").css({
            "margin" : "0 auto"
        }).append(selectContent);

        var dialogFooter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).css('margin','5px 5px 6px').text("Create").click(function() {
            // Create New a file
            var reg = /.+\..+/;
            var project_name = sessionStorage.getItem('project');
            var paths = $.jstree._focused().get_path();
            var file_name = $("div input").val();

            if (!reg.test($("div input").val())) {
                return;
            }
            // save file
            $.post('/project/' + project_name + '/new', {
                paths : paths,
                name : file_name,
                type : 'file'
            }, function() {
                console.info('success create file: ' + file_name);
            }, 'json');

            var opt = $("select option:selected").val();
            var type;
            if (opt === ".html") {
                type = "file-html";
            } else if (opt === ".js") {
                type = "file-js";
            } else {
                type = "file-css";
            }
            // create
            $("#browser").jstree("create", ele, "last", {
                data : $("#dialog>div.modal-body input").val(),
                attr : {
                    rel : type
                }
            }, function(o) {
            }, true);
            $("#dialog").modal('hide');

            //Notification
            var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.user.name + '</a>' + ' has created a new file <a href="#" class="notification-file-a">' + file_name + '</a> under <a class="notification-project-a" href="#">' + sessionStorage.getItem('project') + '</a> project.</span>';
            ns.sendNotification(notifMsg, "information", true, 'g');

            //refreshProjectTree();
        }));

        $("#dialog>div.modal-header").html(dialogHeader);
        $("#dialog>div.modal-body").html(dialogContent);
        $("#dialog>div.modal-footer").html(dialogFooter);

        $("#dialog").modal();
    }

    function refreshProjectTree() {
        // FIXME: find the other to refresh the tree.
        $.get('/project', {
            name : sessionStorage.getItem('project')
        }, function(data) {
            createJsTreeByJSON(data);
        });
    }

    function createFolder(ele) {
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Folder</p>";
        var dialogContent = $("<div>").css({
            "margin" : "0 auto"
        }).append($("<p>").append($("<input>").attr({
            type : "text",
            placeholder : "Enter folder name",
            width : "100%",
            required : true
        })));
        var dialogFooter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).css('margin','5px 5px 6px').text("Create").click(function() {
            //  TODO save folder
            var project_name = sessionStorage.getItem('project');
            var paths = $.jstree._focused().get_path();
            var folder_name = $("div input").val();
            $.post('/project/' + project_name + '/new', {
                paths : paths,
                name : folder_name,
                type : 'folder'
            }, function() {
            }, 'json');

            // create
            $("#browser").jstree("create", ele, "last", {
                data : $("#dialog>div.modal-body input").val(),
                attr : {
                    rel : 'folder'
                }
            }, function(o) {
            }, true);

            $("#dialog").modal('hide');
            var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.user.name + '</a>' + ' has created a new folder <a href="#" class="notification-file-a">' + folder_name + '</a> under <a class="notification-project-a" href="#">' + sessionStorage.getItem('project') + '</a> project.</span>';
            ns.sendNotification(notifMsg, "information", true, 'g');
        }));
        $("#dialog>div.modal-header").html(dialogHeader);
        $("#dialog>div.modal-body").html(dialogContent);
        $("#dialog>div.modal-footer").html(dialogFooter);
        $("#dialog").modal();
    }

    function cleanSessionStorage() {
        try{
        sessionStorage.removeItem('project');
        sessionStorage.removeItem('docName');
        }
        catch(e){
            console.log(e);
        }
        finally{
            
        }
    }


    $("#left-items").width(205);
    $("#project-tree").jstree();
    $("#nav-tab a:first").tab("show");
    $("#nav-tab a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
        var _class = $("#nav-tab li.active a i").attr("class");
        $("#nav-tab li.active a i").attr("class", _class + " icon-white");
        $("#nav-tab li:not(.active) a i").each(function(e) {
            _tmp = $(this).attr("class");
            $(this).attr("class", _tmp.split(" ")[0]);
        });
    });
    $("#nav-tab a:first").click();
    $(".dropdown-toggle").dropdown();
    function hideLeftArea(toggleButton) {
        $("#left-items").animate({
            width : "0px",
            "min-width" : "0px"
        }, {
            duration : 200,
            step : function() {
                $("#left-splitter").animate({
                    left : $("#left-items").width()
                });
                _original_left = $("#editor-area").position().left;
                _new_left = $(".left-splitter").position().left + $(".left-splitter").usedWidth();
                $("#editor-area").css("left", $(".left-splitter").position().left + $(".left-splitter").width());
                $("#editor-area").width($("#editor-area").width() + (_original_left - _new_left));
                $(".CodeMirror").width($("#editor-area").width());
            }
        });
        toggleButton.attr("data-action", "#show").css("left", "0px");
        $(".left-splitter-collapse-button").data("tooltip").options.title = "Show";
        $(".left-splitter-collapse-button").data("tooltip").options.placement = "right";
    }

    function showLeftArea(toggleButton) {
        $("#left-items").animate({
            width : "205px",
            "margin-left" : "5px"
        }, {
            duration : 200,
            step : function() {
                $("#left-splitter").animate({
                    left : $("#left-items").width()
                });
                _original_left = $("#editor-area").position().left;
                _new_left = $(".left-splitter").position().left + $(".left-splitter").width();
                $("#editor-area").css("left", $(".left-splitter").position().left + $(".left-splitter").width());
                $("#editor-area").width($("#editor-area").width() + (_original_left - _new_left));
                $(".CodeMirror").width($("#editor-area").width());
            }
        });
        toggleButton.attr("data-action", "#hide").css("left", "-1px");
        $(".left-splitter-collapse-button").data("tooltip").options.title = "Hide";
        $(".left-splitter-collapse-button").data("tooltip").options.placement = "top";
    }


    $(".left-splitter-collapse-button").click(function() {
        if ($("button[data-action=editor-livepreview-toggle]").attr("data-status") === "on")
            return;
        if ($(this).attr("data-action") === "#hide") {
            hideLeftArea($(this));
        } else {
            showLeftArea($(this));
        }
    });
    
    function startIdleTimer(idleTime){        
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p style='text-align:center;font-weight:bold;' class='text-error'>***Warning***</p><p></p>";
        var dialogContent = "<p>You were idle for more than " + idleTime/60 + " minutes, and you are about to be logged out in <span id='dialog-countdown' class='text-error'></span> seconds!</p>";                
        
        var dialogFooter = $("<div>").css({'text-align':'center'}).append($("<a href='#'>").attr({
            class : "btn btn-success"            
        }).text("Keep Working").click(function() {
            $.idleTimeout.options.onResume.call(this);                       
        })).append($("<a href='#'>").attr({
            class : "btn btn-primary"                        
        }).css("margin","5px 5px 6px").text("Loggoff").click(function(){
            $.idleTimeout.options.onTimeout.call(this);
        }));
        
        $(".idle.modal-header").html(dialogHeader);
        $(".idle.modal-body").html(dialogContent);
        $(".idle.modal-footer").html(dialogFooter);
        
        $.idleTimeout('#idleDialog', '#idleDialog', {
            idleAfter: idleTime,                        
            onTimeout: function(){
                _logout({"reason":"idle"});
            },
            onIdle: function(){
                $("#idleDialog").modal('show');
            },
            onResume: function(){
                $("#idleDialog").modal('hide');                
            },
            onCountdown: function(counter){
                var $countdown = $('#dialog-countdown');
                $countdown.html(counter); // update the counter
            }
        });
    }
    /*function hideCommentArea(toggleButton) {
    $("#right-items").hide("drop", {
    direction : "right"
    }, 200);

    var newWidth = $("#editor-area").width() + $("#right-items").usedWidth() - 10;
    $("#editor-area").animate({
    width : newWidth
    }, {
    duration : 200,
    step : function(now, fx) {
    $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
    $(".CodeMirror").width(newWidth);
    }
    });

    toggleButton.attr("data-action", "#show").css("left", "-2px");
    $(".right-splitter-collapse-button").data("tooltip").options.title = "Show Comments";
    $(".right-splitter-collapse-button").data("tooltip").options.placement = "left";
    }

    function showCommentArea(toggleButton) {
    $("#right-items").show("drop", {
    direction : "right"
    }, 200);
    toggleButton.attr("data-action", "#hide").css("left", "-1px");
    $(".right-splitter-collapse-button").data("tooltip").options.title = "Hide Comments";
    $(".right-splitter-collapse-button").data("tooltip").options.placement = "top";

    var newWidth = $("#editor-area").width() - $("#right-items").usedWidth() + 10;

    $("#editor-area").animate({
    width : newWidth
    }, {
    duration : 200,
    step : function(now, fx) {
    $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
    $(".CodeMirror").width(newWidth);
    }
    });

    }

    $(".right-splitter-collapse-button").click(function() {
    if ($("button[data-action=editor-livepreview-toggle]").attr("data-status") === "on")
    return;

    if ($(this).attr("data-action") === "#hide") {
    hideCommentArea($(this));
    } else {
    showCommentArea($(this));
    }
    });*/

    // TODO: put into configure function CodeMirror
    // var elem = document.getElementById("home");
    CodeMirror.commands.autocomplete = function(cm) {
        var mode = cm.getOption("mode");
        if (mode === "htmlmixed") {
            CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
            CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
        } else if (mode === "text/html" || mode == "xml") {
            CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
        } else if (mode === "javascript") {
            CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
        }
    };

    layout();
    // TODO: remove after finished
    $.get('/project', {
        name : sessionStorage.getItem('project')
    }, function(data) {
        createJsTreeByJSON(data);
        $("#dialog").modal('hide');
    });

    $(".btn-logout").click(function() {
        _logout({"reason": "logoutButton"});                                
    });

    $("a[data-action=editor-new-file]").click(function() {
        createFile(this);
    });
    $("a[data-action=editor-new-project]").click(function() {
        // TODO: pop up a window, asking user close/save current project
        _newProject();
    });

    $("a[data-action=editor-open-project]").click(function() {
        // fetch project list
        _openProject();        
    });

    $("a[data-action=editor-close-project]").click(function() {
        // fetch project list
        _closeProject();
    });
    
    function _logout(options){
        var reason = options.reason;
        
        switch(reason){
            case 'idle':
                //TODO: save current open document on the server, appropriate notification
            break;
            case 'logoutButton':
                //TODO: save current open document on the server, appropriate notification
            break;
            case 'windowClose':
                //save current open document on the server, appropriate notification
            break;
        }
        
        cleanSessionStorage();
        now.changeProjectGroup(undefined);
        
        var notifMsg = now.user.name + " is offline!";
        ns.sendNotification(notifMsg, "error", false, 'e');
        window.location.href = '/logout';
    }

    $("a[data-action=editor-share-code]").click(function() {
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>Share via this link</p>";
        var project_name = sessionStorage.getItem("project");
        var doc_shareJSId = sessionStorage.getItem("docName");
        var dialogContent = $("<div>").append($("<p>").text(document.location.origin + "/" + project_name + "/" + doc_shareJSId)).append($("<p>").attr("margin-bottom", "5px").append($('<input>').attr({
            type : "text",
            id : "collaboratorEmail",
            placeholder : "Enter a valid username",
            width : "100%",
            required : true
        })));

        var dialogFooter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).css('margin','5px 5px 6px').text("Share").click(function() {
            //TODO: Send notification to user
        }));

        $("#dialog>div.modal-header").html(dialogHeader);
        $("#dialog>div.modal-body").html(dialogContent);
        $("#dialog>div.modal-footer").html(dialogFooter);
        $("#dialog").modal();
    });

    var users;

    function _openProject() {
        $.get('/project/list', function(projects) {
            var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>Open Project</p>";
            var project_table = $('<table>').attr({
                'class' : 'table table-striped table-bordered'
            });
            project_table.html('<thead><tr><th>#</th><th>Project Name</th><th>Created On</th><th>Last Modified On</th></tr></thead>');
            var tbody = $('<tbody>');
            var tr;
            for (var i = 0; i < projects.length; i++) {
                tr = $('<tr>');
                tr.append($('<td>').html(i + 1)).append($('<td>').append($('<a>').attr('href', '#').append(projects[i].name).click(function() {
                    // TODO: pop up close alert
                    sessionStorage.setItem('project', $(this).text());
                    $.get('/project', {
                        name : sessionStorage.getItem('project')
                    }, function(data) {
                        createJsTreeByJSON(data);
                        $("#dialog").modal('hide');

                        //TODO "Now" Group Change, Remove User From Old Group
                        now.changeProjectGroup(sessionStorage.getItem('project'));
                        //now.sayHi();
                    });
                }))).append($('<td>').html(projects[i].created_on)).append($('<td>').html(projects[i].last_modified_on));
                tbody.append(tr);
            }
            project_table.append(tbody);
            var dialogContent = project_table;
            $("#dialog>div.modal-header").html(dialogHeader);
            $("#dialog>div.modal-body").html(dialogContent);
            $("#dialog>div.modal-footer").html('');
            project_table.dataTable();
            $("#dialog").modal();
        });
    }


    now.updateList = function(users) {
        function getDocPathName(docPath) {
            if (docPath === 'undefined')
                return {
                    doc : "nothing...",
                    path : ""
                };
            var path = docPath.split("/");
            var doc = path.splice(path.length - 1);
            return {
                doc : doc[0],
                path : path.join("/")
            };
        }


        $("#chat-users-list").html("");
        var pname = sessionStorage.getItem('project');
        $.each(users[pname], function(index, user) {
            var docPath = getDocPathName(user.currentDocument);
            var cuItem = $("<div>").attr("chat-user-id", user._id).addClass("cu-item").append($("<table>").css({
                'width' : '100%',
                'height' : '100%',
                'text-align' : 'center'
            }).append($("<tr>").attr('align', 'center').append($("<td>").css("width", "20px").append($("<div>").addClass("cu-status-available"))).append($("<td>").css("width", "20px").append("<img src=assets/img/silhouette.png></img>")).append($("<td>").css({
                'text-align' : 'left',
                'padding-left' : '5px'
            }).attr('valign', 'middle').append($("<a>").css({
                "font-weight" : "bold",
                "font-size" : "12px"
            }).text(user.user + " ").addClass("text-info")))).append($("<tr>").tooltip({
                title : docPath.path,
                placement : "bottom"
            }).attr('align', 'left').append($("<td colspan='3'>").append($("<span>").css({
                "font-size" : "10px"
            }).addClass("text-warning").text("Editing " + docPath.doc)))));
            $("#chat-users-list").append($("<li>").html(cuItem));
        });
    }
    function _closeProject() {
        //TODO clear the tree, clear the editor, clear the comments, change roomnow.changeProjectGroup(undefined);        
        now.changeProjectGroup(undefined);
        $("#browser").html('');
        $("#editor-area>div.CodeMirror").remove();
        $("#editor-area>div.inlet_slider").remove();
        $("#editor-area>ul").html("").append($("<li>").append($("<a>").attr("href", "#")));
        $("#chat.tab-pane>table>tbody>tr>td>ul").html('');
        $("#right-items").css("display", "none");
        $("#right-items>div").html("");
        sessionStorage.clear();
        currentDocumentPath = '';
    }

    function _newProject() {
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Project</p>";
        var dialogContent = '<input type="text" id="project_name" placeholder="Enter project name" width="100%" required/><br/><input type="text" id="users" width="100%" required/>';

        var dialogFooter = $("<div>").append($("<button>").attr({
            class : "btn btn-primary",
            type : 'submit'
        }).text("Create").click(function() {
            if ($("#dialog input").val() === "") {
                var error_msg = '<div class="alert alert-error">' + '<button class="close" data-dismiss="alert">×</button>' + "Please enter a valid name for your project." + "</div>";
                if (!$("#dialog .alert")[0])
                    $("#dialog").append(error_msg);
            } else {
                var project_name = $("#project_name").val();
                // save client
                sessionStorage.setItem('project', project_name);
                // post to server
                var users = $("#as-values-users_list").attr("value").split(",");
                users.pop();
                $.post("/project/new", {
                    pname : project_name,
                    users : users
                }, function() {
                    console.info("success create" + $("#project_name").val());
                });
                createNewJsTree($("#dialog input").val());
                $("#dialog").modal('hide');

                //Notification
                var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.user.user + '</a>' + ' has created a new project <a class="notification-project-a" href="#">' + sessionStorage.getItem('project') + '</a></span>';
                ns.sendNotification(notifMsg, "information", false, 'e');
            }
        })).css('margin','5px 5px 6px').append($("<button>").attr({
            class : "btn",
            type : 'button',
            "data-dismiss" : "modal"
        }).text("Cancel"));
        $("#dialog>div.modal-header").html(dialogHeader);
        $("#dialog>div.modal-body").html(dialogContent);
        $("#dialog>div.modal-footer").html(dialogFooter);

        $("#users").autoSuggest("/users/list", {
            selectedItemProp : "name",
            searchObjProps : "name",
            selectedValuesProp : "user",
            selectionLimit : 5,
            startText : "Add user name here",
            asHtmlID : "users_list"
        });
        $("#dialog").modal();
    }

    function _hotkeysHandler() {
        var commandKey = "ctrl";
        var metaKey = "meta";
        var hotkeys = {
            NEW_FILE : commandKey + "+n",
            NEW_FOLDER : commandKey + "+n",
            NEW_PROJECT : commandKey + "+shift+n",
            OPEN_PROJECT : commandKey + "+o",
            CLOSE_PROJECT : commandKey + "+w",
            SAVE : commandKey + "+s",
            CUT : commandKey + "+x",
            COPY : commandKey + "+c",
            PASTE : commandKey + "+v",
            UNDO : commandKey + "+z",
            REDO : commandKey + "+shift+z",
            DELETE : "backspace",
            SELECT_ALL : commandKey + "+a",
            FIND : metaKey + "+f",
            FIND_NEXT : metaKey + "+g",
            FIND_PREVIOUS : metaKey + "+shift+g",
            REPLACE : metaKey + "+shift+f",
            ZOOM_IN : commandKey + "++",
            ZOOM_OUT : commandKey + "+-",
            ACTUAL_SIZE : commandKey + "+0",
            FULLSCREEN : "f11",
            COMMENT : commandKey + "+/",
            UNCOMMENT : commandKey + "+/",
            FORMAT_CODE : commandKey + "+l",
            CHECK_QUALITY : commandKey + "+shift+j",
            SHARE_CODE : commandKey + "+shift+s",
            ABOUT : commandKey + "+i"
        };

        $(document).bind('keyup', hotkeys.OPEN_PROJECT, function() {
            _openProject();
        });

        $(document).bind('keyup', hotkeys.NEW_PROJECT, function() {
            _newProject();
        });

        $(document).bind('keyup', hotkeys.FULLSCREEN, function() {
            _fullscreen();
        });
        
        $(document).bind('keyup', hotkeys.SAVE, function() {                       
            saveCodeXML(myCodeMirror);
        });
        //TODO: add all shortcuts/hotkeys
    }

    function _switchLiveViewButton(enable) {
        if (enable) {
            $("button[data-action=editor-livepreview-toggle]").removeAttr("disabled").removeClass("disabled");
        } else {
            $("button[data-action=editor-livepreview-toggle]").attr("disabled", "disabled").addClass("disabled");
        }
    }

    function _fullscreen() {
        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }

    function _toggleLiveView(toggleLiveView) {
        var live_preview_toggle = $("button[data-action=editor-livepreview-toggle]");
        var live_preview_toggle_icon = $("button[data-action=editor-livepreview-toggle] i");
        //Show live preview
        if (toggleLiveView) {
            live_preview_toggle_icon.removeClass("icon-eye-close").addClass("icon-eye-open");
            live_preview_toggle.data("tooltip").options.title = "Turn Live Preview Off!";
            live_preview_toggle.attr("data-status", "on");
            //Add Preview Area
            var preview_left = $(".CodeMirror").usedWidth() + 5;
            var preview_top = 52;
            //$(".breadcrumb").usedHeight() + parseInt($(".breadcrumb").css("line-height"));
            var preview_width = $(".CodeMirror").width() + 10;
            var live_preview_iframe_content = "<!DOCTYPE html><html><head></head><body></body></html>";

            var live_preview_window = $("<div>").height($(".CodeMirror").height()).attr({
                id : "live_preview_window"
            }).css({
                position : "absolute",
                top : (preview_top + "px"),
                float : "left",
                "background-color" : "#FFFFFF",
                "margin-left" : "7px",
                border : "1px solid #DDD"
            }).html("<iframe id='live_preview_target' class='preview_iframe'>" + live_preview_iframe_content + "</iframe>");
            $("#editor-area").append(live_preview_window);
            //TODO:Inject Content to iFrame Here
            // myCodeMirror.setOption("onChange", function(cm, changedText){
            // console.log(changedText.text);
            // while(temp){
            // temp = temp.next;
            // console.log(temp.text);
            // }
            // });

            //Hide Comment Area
            var pt = $('#live_preview_target')[0].contentWindow.document;
            pt.open();
            pt.close();
            $('body', pt).append(myCodeMirror.getValue());

            myCodeMirror.setOption("onChange", function(cm, change) {
                var preview = $('#live_preview_target')[0].contentWindow.document;
                preview.open();
                preview.close();

                var html = cm.getValue();
                $('body', preview).append(html);
            });

            /*var isCommentVisible = ($("#right-items").is(":visible"));
            if (isCommentVisible) {
            $("#right-items").hide("drop", {
            direction : "right"
            }, 200);
            }*/

            //Expand Editor/Preview Area
            $("#editor-area").animate({
                width : $("#editor-area").width() //Check this damn thing here!
            }, {
                duration : 200,
                step : function(now, fx) {
                    //$(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
                    $(".CodeMirror").width($("#editor-area").width() / 2 - 5);
                    $("#live_preview_window").width($(".CodeMirror").width());
                    $("#live_preview_window").css({
                        left : $(".CodeMirror").width()
                    });
                }
            });

            /*$(".right-splitter-collapse-button").attr("data-action", "#show").css("left", "-2px");
             $(".right-splitter-collapse-button").data("tooltip").options.title = "Show Comments";
             $(".right-splitter-collapse-button").data("tooltip").options.placement = "left";*/

        }
        //Hide live preview
        else {
            $("button[data-action=editor-livepreview-toggle] i").removeClass("icon-eye-open").addClass("icon-eye-close");
            live_preview_toggle.data("tooltip").options.title = "Turn Live Preview On!";
            live_preview_toggle.attr("data-status", "off");
            //Remove Preview Area
            myCodeMirror.setOption("onChange", null);
            $("#live_preview_window").remove();

            /*var isCommentVisible = $(".right-splitter-collapse-button").attr("data-action") === "#hide";
             if (!isCommentVisible) {
             $("#right-items").show("drop", {
             direction : "right"
             }, 200);
             }*/

            $("#editor-area").animate({
                width : $("#editor-area").width() //Check this damn thing here
            }, {
                duration : 200,
                step : function(now, fx) {
                    //$(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
                    $(".CodeMirror").width($("#editor-area").width());
                }
            });

            /*$(".right-splitter-collapse-button").attr("data-action", "#hide").css("left", "-1px");
             $(".right-splitter-collapse-button").data("tooltip").options.title = "Hide Comments";
             $(".right-splitter-collapse-button").data("tooltip").options.placement = "top";*/
        }
    }


    $("button[data-action=editor-livepreview-toggle]").click(function() {
        var live_preview_toggle = $("button[data-action=editor-livepreview-toggle]");
        var live_preview_toggle_icon = $("button[data-action=editor-livepreview-toggle] i");
        var ea_original_width = $("#editor-area").width();

        if (live_preview_toggle.attr("data-status") === 'off') {
            //TODO: Hide comment area on right and split editor area into two equal sections
            _toggleLiveView(true);

        } else {
            //TODO: Merge equal sections in editor area and show comments
            _toggleLiveView(false);

        }
    });

    $('#chat-start').click(function() {
        var pname = sessionStorage.getItem('project');
        chatWith('GroupChat');
    });

    function appendComment(comment) {
        if ($('#' + comment.cid).size() === 0) {
            createComment(comment.line, comment.content, comment.who);
        }

        var ts = new Date(comment.timestamp);
        var tsstring = "On " + ts.toDateString() + " at " + ts.toLocaleTimeString();
        var content = comment.content;

        var commentItem = $('<div>').addClass('CodeMirror-commentitem').append($('<p>').css('margin', '2px').html($('<span>').css({
            'font-weight' : 'bold',
            'font-size' : '10px',
            'font-color' : '#3399FF'
        }).html(comment.who).append($('<span>').css({
            'font-weight' : 'normal',
            'font-size' : '10px'
        }).html(': ' + comment.content))).append($('<p>').css({
            'font-size' : '8px',
            'text-align' : 'left',
            'margin-bottom' : '-1px'
        }).html(tsstring)));

        var commentContent = $('#' + comment.cid).find("table tbody tr div.commentContent");
        $(commentContent).append(commentItem);
    }

    function createComment(line, content, who) {
        //TODO Add Database Model tricky! :-/
        var dln = line;
        hideComments(dln);
        var pname = sessionStorage.getItem('project');

        var commentIcon = $("<div>").attr({
            "data-line-number" : dln,
            "tabindex" : "-1"
        }).addClass("CodeMirror-commentsicons").tooltip({
            title : "Show Discussion!"
        });

        myCodeMirror.addLineClass(dln - 1, 'wrap', 'commentMarker commentMarkerInvisible');

        var comment = $("<div>").attr({
            "data-line-number" : dln,
            "id" : "comment-" + dln,
            "tabindex" : "-1"
        }).attr("editor-comment-isopen", "true").html($("<table>").css({
            "width" : "100%",
            "height" : "100%"
        }).append($("<tbody>").append($("<tr>").append($("<td>").append($("<div>").addClass("commentContent")))).append($("<tr>").append($("<td>").attr("valign", "bottom").append($("<div>").addClass("commentEntry").append($("<input>").css({
            "margin" : "2px auto",
            "width" : "160px"
        }).attr({
            'placeholder' : 'Reply to this comment...',
            'type' : 'text'
        }).keydown(function(e) {
            if (e.which === 13) {

                var taggedUsers = [];
                content = $(this).val().split(' ');
                var ts = new Date();

                var finalContent = '';
                $.each(content, function(index, value) {
                    var tempATag;
                    if (value.indexOf('@') == 0) {
                        tempATag = '<a href="#" class="commentMentionTag">' + value.slice(1) + '</a>';
                        taggedUsers.push(value.slice(1));
                    } else
                        tempATag = value;
                    finalContent += (' ' + tempATag);
                });

                var nowComment = {};
                nowComment.content = finalContent;
                nowComment.who = now.user.user;
                nowComment.line = $($(this).parents()[5]).attr('data-line-number');
                nowComment.timestamp = ts;
                nowComment.taggedUsers = taggedUsers;
                nowComment.path = currentDocumentPath;
                nowComment.cid = $($(this).parents()[5]).attr('id');

                $(this).val('');
                appendComment(nowComment);
                now.sendComment(nowComment);
            }
        }))))))).addClass("comment");

        $($(comment).find("table>tbody>tr>td")[1]).find(".commentEntry>input").triggeredAutocomplete({
            source : "/users/mentionList",
            minLength : 2,
            allowDuplicates : false,
            trigger : "@",
            hidden : '#hidden_inputbox'
        });

        $(comment).click(function(e) {
            $($(comment).find("table>tbody>tr>td")[1]).find(".commentEntry>input").focus();
        });

        commentIcon.click(function(e) {
            var editorLN = $(this).attr('data-line-number');
            var comment = $("#comment-" + editorLN);

            if ($(comment).attr("editor-comment-isopen") === "true") {
                $(comment).attr("editor-comment-isopen", "false");
                myCodeMirror.removeLineClass(editorLN - 1, 'wrap', 'commentMarker');
                $(comment).hide(400);
                $(this).tooltip({
                    title : "Show Discussion!"
                });
                return false;
            }

            hideComments(editorLN);

            $(this).tooltip({
                title : "Hide Discussion!"
            });
            myCodeMirror.addLineClass(editorLN - 1, 'wrap', 'commentMarker commentMarkerInvisible');
            $(comment).attr("editor-comment-isopen", "true");
            $(comment).show(400);

            $($(comment).find("table>tbody>tr>td")[1]).find(".commentEntry>input").focus();
        });

        var commentIconObg = {};
        commentIconObg.lineNumber = dln;
        commentIconObg.commentDom = comment;
        commentIconObg.content = content;
        sideComments.push(commentIconObg);

        var lineHandle = myCodeMirror.getLineHandle(dln - 1);
        myCodeMirror.on("delete", function(cm, line) {
            cm.setGutterMarker(lineHandle, "CodeMirror-commentsiconsGutter", null);
        });

        myCodeMirror.setGutterMarker(lineHandle, "CodeMirror-commentsGutter", comment.get(0));
        myCodeMirror.setGutterMarker(lineHandle, "CodeMirror-commentsiconsGutter", commentIcon.get(0));
        //Add Bookmark
        var bm = addBookmarks("comment", dln, myCodeMirror);
        var ctext = (content === null) ? "" : commentIconObg.content;
        $(bm.dom).tooltip({
            title : ctext,
            placement : "left"
        });
        //set focus on entry
        $(comment).show(400);
        $($(comment).find("table>tbody>tr>td")[1]).find(".commentEntry>input").focus();
    };

    function hideComments(ln) {
        for (var i = 0; i < sideComments.length; i++) {
            var sco = sideComments[i];
            if (sco.lineNumber !== ln) {
                $(sco.commentDom).attr("editor-comment-isopen", "false");
                $(sco.commentDom).hide(200);
                myCodeMirror.removeLineClass(sco.lineNumber - 1, "wrap", 'commentMarker');
            }
        }
    }


    $("a[data-action=editor-find-replace]").click(function() {
        //TODO: find/replace
    });

    $("a[data-action=editor-find-next]").click(function() {
        //TODO: find next
    });
    $("a[data-action=editor-find-previous]").click(function() {
        //TODO: find previous
    });
    $("a[data-action=editor-comment-selected]").click(function() {
        commentSelection(true);
    });
    $("a[data-action=editor-uncomment-selected]").click(function() {
        commentSelection(false);
    });
    $("a[data-action=editor-format-selected-code]").click(function() {
        autoFormatCode();
    });
    $("a[data-action=editor-check-quality]").click(function() {
        checkQuality();
    });
    $("a[data-action=editor-enter-fullscreen]").click(function() {
        _fullscreen();
    });

    $("a[data-action=editor-console-toggle]").click(function() {
        if ($(this).attr("href") === "#show")
            showConsole($(this));
        else
            hideConsole($(this));
    });

    $("a[data-action=editor-console-clean]").click(function() {
        $("#small-console>div").html("");
    });

    /*
     Tooltip
     */
    $(".left-splitter-collapse-button").tooltip({
        title : "Hide"
    });

    /*$(".right-splitter-collapse-button").tooltip({
     title : "Hide Comments"
     });*/

    $("button[data-action=editor-livepreview-toggle]").tooltip({
        title : "Turn Live Preview On!",
        placement : "bottom"
    });

    $("a[data-action=editor-console-toggle]").tooltip({
        title : "Show Console",
        placement : "left"
    });

    $("a[data-action=editor-console-clean]").tooltip({
        title : "Clean Console",
        placement : "left"
    });
});
