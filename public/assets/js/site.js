function _(string, context) {
    return string.replace(/%\(\w+\)s/g, function(match) {
        return context[match.slice(2, -2)];
    });
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
        profile : "xhtml",              
        onKeyEvent : function() {
            return zen_editor.handleKeyEvent.apply(zen_editor, arguments);
        }
    });
    CodeMirror.commands.selectAll(_editor);
    $(".CodeMirror-wrap").addClass("context-menu-one box menu-1");     
    return _editor;
}

function reportFailure(report) {
    var errors = $("#small-console div");
    var item;
    errors[0].innerHTML = "";
    errors.append(_(editorMessage.errorMessage, {
        message : "JSHint has found " + report.errors.length + " potential problems in your code."
    }));
    for (var i = 0, err; err = report.errors[i]; i++) {
        if (!err.scope || err.scope === "(main)") {            
            errors.append(_('<li><p>' + templates.error + '</p></li>', {
              line: err.line,
              code: err.evidence ? escapeHTML(err.evidence) : '&lt;no code&gt;',
              msg:  err.reason
            }));
            myCodeMirror.setMarker(err.line - 1, "<span style=\"color: #900\">●</span> %N%");
        } else {
            myCodeMirror.setMarker(err.line - 1, "<span style=\"color: #900\">●</span> %N%");
            errors.append(_("<li><p>" + templates.error + "</p></li>", {
                line : err.line,
                character : err.character,
                code : $.trim(err.evidence) ? $.trim(escapeHTML(err.evidence)) : "",
                msg : err.reason
            }));
        }
        $("a[data-line=" + err.line + "]").bind("click", function(ev) {
            var line = $(this).attr("data-line") - 1;
            var str = myCodeMirror.getLine(line);
            myCodeMirror.setSelection({
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
    success.append(_(editorMessage.successMessage, {
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
    $(".right-splitter").height(_height);
    $(".left-splitter-collapse-button").css("margin-top", _height / 2);
    $(".right-splitter-collapse-button").css("margin-top", _height / 2);
    $(".tab-pane").css("height", "100%");
    $("#right-items").height(_height);
    $("#editor-area").css("left", $(".left-splitter").position().left + $(".left-splitter").usedWidth());
    $("#editor-area").css("width", document.documentElement.clientWidth - ($("#right-items").is(":visible") ? 300 : 10) - ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) - $(".left-splitter").usedWidth() - $(".right-splitter").usedWidth());
    if ($("#left-items").is(":visible")) {
        if ($("#right-items").is(":visible")) {
            $("#right-items").css("left", $("#left-items").usedWidth() + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth() + $(".right-splitter").usedWidth());
            $(".right-splitter").css("left", $("#left-items").usedWidth() + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
            $("#right-items").css("width", 300);
        }
    } else {
        if ($("#right-items").is(":visible")) {
            $("#right-items").css("left", $(".left-splitter").usedWidth() + $("#editor-area").usedWidth() + $(".right-splitter").usedWidth());
        } else {
            $(".right-splitter").css("left", $(".left-splitter").usedWidth() + $("#editor-area").usedWidth() + 4);
        }
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
});

$(document).ready(function() {
    sessionStorage.clear();
    window.doc = null;
    window.pid = null;
    // TODO
    _hotkeysHandler();  
    
    
    //Notification Setup
    //Notification Code
    ns.sendNotification = function(notyMsg, notyType, needRefresh, type) {
        now.sendNotification(notyMsg, notyType, needRefresh, type);
        return false;
    }

    now.receiveNotification = function(notyObj, needRefresh) {
        if (notyObj.senderId == now.core.clientId)
            return;
        var ntfcn = noty({
            text : notyObj.text,
            template : '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
            type : notyObj.type,
            theme : 'defaultTheme',
            dismissQueue : true,
            layout : 'bottomLeft',
            timeout : 5000,
            closeWith : ['button'],
            buttons : false,
        });

        if (needRefresh)
            refreshProjectTree();
    }
    //
    
    $('#browser').bind('click', function() {
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
            CodeMirror.commands.selectAll(myCodeMirror);
            sharejs.open(docName, function(error, newdoc) {
                if (doc !== null) {
                    doc.close();
                    // doc.detach_codemirror();
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
            if (file_type === 'file-html'){
                _switchLiveViewButton(true);                
            }
            else {
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
                                        console.log('test');
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
                                    console.log(obj);
                                    var project_name = sessionStorage.getItem('project');
                                    $.post('/project/' + project_name + '/rename', {
                                        old_name : obj.old_name,
                                        new_name : obj.new_name
                                    }, function(data) {
                                        console.log(data);
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
                            if(this.is_selected(obj)) { this.remove(); } else { this.remove(obj); }
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
            reportFailure(JSHINT.data());
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
                    uncomment_error.append(_(editorMessage.errorMessage, {
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
                comment_error.append(_(editorMessage.errorMessage, {
                    message : "Please select uncommented text you want to comment."
                }));
            else
                comment_error.append(_(editorMessage.errorMessage, {
                    message : "Please select commented text you want to uncomment."
                }));
            $("#small-console").toggleClass("small-console-animated");
            showConsole($("a[data-action=editor-console-toggle]"));
        }
    }
  
  function deleteElement (ele) {
    var project_name = sessionStorage.getItem('project');
    var id = $.jstree._focused().get_selected().attr('data-sharejsid');
    var paths = $.jstree._focused().get_path();
        $.post('/project/' + project_name + '/' + id + '/delete', {
            paths : paths,
            type : 'file'
        }, function() {
            console.log('success create file: ' + file_name);
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

        var dialogFotter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).text("Create").click(function() {
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
            if (opt == ".html") {
                type = "file-html";
            } else if (opt == ".js") {
                type = "file-js";
            } else {
                type = "file-css";
            }
            // create
            $("#browser").jstree("create", ele, "last", {
                data : $(".modal-body input").val(),
                attr : {
                    rel : type
                }
            }, function(o){}, true);
            $("#dialog").modal('hide');
            
            //Notification
            var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.name + '</a>' + ' has created a new file <a href="#" class="notification-file-a">' + file_name + 
            '</a> under <a class="notification-project-a" href="#">'+ sessionStorage.getItem('project') + '</a> project.</span>';
            ns.sendNotification(notifMsg, "information", true, 'g');         
            
      //refreshProjectTree();
        }));

        $(".modal-header").html(dialogHeader);
        $(".modal-body").html(dialogContent);
        $(".modal-footer").html(dialogFotter);
        
        $("#dialog").modal();
    }

  function refreshProjectTree() {
        // FIXME: find the other to refresh the tree.
        $.get('/project', {
            name : sessionStorage.getItem('project')
        }, function(data) {
            createJsTreeByJSON(data);
        })
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
        var dialogFotter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).text("Create").click(function() {
            //  TODO save folder
            var project_name = sessionStorage.getItem('project');
            var paths = $.jstree._focused().get_path();
            var folder_name = $("div input").val();
            $.post('/project/' + project_name + '/new', {
                paths : paths,
                name : folder_name,
                type : 'folder'
            }, function() {
                console.log('success create folder: ' + folder_name);
            }, 'json');

            // create
            $("#browser").jstree("create", ele, "last", {
                data : $(".modal-body input").val(),
                attr : {
                    rel : 'folder'
                }
            }, function(o){}, true);

            $("#dialog").modal('hide');
            var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.name + '</a>' + ' has created a new folder <a href="#" class="notification-file-a">' + folder_name + 
            '</a> under <a class="notification-project-a" href="#">'+ sessionStorage.getItem('project') + '</a> project.</span>';
            ns.sendNotification(notifMsg, "information", true, 'g');
        }));
        $(".modal-header").html(dialogHeader);
        $(".modal-body").html(dialogContent);
        $(".modal-footer").html(dialogFotter);
        $("#dialog").modal();
    }

    function cleanSessionStorage() {
        sessionStorage.removeItem('project');
        sessionStorage.removeItem('docName');
    };

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
    function hideCommentArea(toggleButton) {
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
    });

    // TODO: put into configure function CodeMirror
    // var elem = document.getElementById("home");
    CodeMirror.commands.autocomplete = function(cm) {
        var mode = cm.getOption("mode");
        if (mode == "htmlmixed") {
            CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
            CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
        } else if (mode == "text/html" || mode == "xml") {
            CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
        } else if (mode == "javascript") {
            CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
        }
    };

    layout();
    // TODO: remove after finished
  $.get('/project', {name: sessionStorage.getItem('project')}, function(data) {
  createJsTreeByJSON(data);
  $("#dialog").modal('hide');
  });

    $(".btn-logout").click(function() {
        cleanSessionStorage();      
        var notifMsg = now.name + " is offline!";
        ns.sendNotification(notifMsg, "error", false, 'e');        
        window.location.href = '/logout';       
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

        var dialogFotter = $("<div>").append($("<a>").attr({
            class : "btn",
            "data-dismiss" : "modal"
        }).text("Cancel")).append($("<a>").attr({
            class : "btn btn-primary"
        }).text("Share").click(function() {
            //TODO: Send notification to user
        }));

        $(".modal-header").html(dialogHeader);
        $(".modal-body").html(dialogContent);
        $(".modal-footer").html(dialogFotter);
        $("#dialog").modal();
    });
    
    
    function _openProject(){
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
                    });
                }))).append($('<td>').html(projects[i].created_on)).append($('<td>').html(projects[i].last_modified_on));
                tbody.append(tr);
            }
            project_table.append(tbody);
            var dialogContent = project_table;
            $(".modal-header").html(dialogHeader);
            $(".modal-body").html(dialogContent);
            $(".modal-footer").html('');
            project_table.dataTable();
            $("#dialog").modal();            
        })
    }
    
    function _closeProject() {
        //TODO clear the tree, clear the editor, clear the comments, change roomnow.changeProjectGroup(undefined);     
        now.changeProjectGroup(undefined);     
        $("#browser").html('');
        $("#chat.tab-pane").html('');
        sessionStorage.clear();           
    }
    
    function _newProject() {
        var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Project</p>";
        var dialogContent = '<input type="text" id="project_name" placeholder="Enter project name" width="100%" required/><br/><input type="text" id="users" width="100%" required/>';

        var dialogFotter = $("<div>").append($("<button>").attr({
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
                sessionStorage.setItem('project', project_name)
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
                var notifMsg = '<span style="text-align:justify"><a href="#" class="notification-user-a">' + now.name + '</a>' + ' has created a new project <a class="notification-project-a" href="#">'+ sessionStorage.getItem('project') + '</a></span>';
                ns.sendNotification(notifMsg, "information", false, 'e');
            }
        })).append($("<button>").attr({
            class : "btn",
            type : 'button',
            "data-dismiss" : "modal"
        }).text("Cancel"));
        $(".modal-header").html(dialogHeader);
        $(".modal-body").html(dialogContent);
        $(".modal-footer").html(dialogFotter);

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
    
    function _hotkeysHandler(){     
        var commandKey = "ctrl";
        var metaKey = "meta";
        var hotkeys = {
            NEW_FILE: commandKey + "+n",
            NEW_FOLDER: commandKey + "+n",
            NEW_PROJECT: commandKey + "+shift+n",
            OPEN_PROJECT: commandKey + "+o",
            CLOSE_PROJECT: commandKey + "+w",
            SAVE: commandKey + "+s",
            CUT: commandKey + "+x",
            COPY: commandKey + "+c",
            PASTE: commandKey + "+v",
            UNDO: commandKey + "+z",
            REDO: commandKey + "+shift+z",
            DELETE: "backspace",
            SELECT_ALL: commandKey + "+a",
            FIND: metaKey + "+f",
            FIND_NEXT: metaKey + "+g",
            FIND_PREVIOUS: metaKey + "+shift+g",
            REPLACE: metaKey + "+shift+f",
            ZOOM_IN: commandKey + "++",
            ZOOM_OUT: commandKey + "+-",
            ACTUAL_SIZE: commandKey + "+0",
            FULLSCREEN: "f11",
            COMMENT: commandKey + "+/",
            UNCOMMENT: commandKey + "+/",
            FORMAT_CODE: commandKey + "+l",
            CHECK_QUALITY: commandKey + "+shift+j",
            SHARE_CODE: commandKey + "+shift+s",
            ABOUT: commandKey + "+i"
        };

    $(document).bind('keyup',hotkeys.OPEN_PROJECT, function(){      
      _openProject();      
    });
        
        $(document).bind('keyup',hotkeys.NEW_PROJECT, function(){           
            _newProject();          
        });
        
        $(document).bind('keyup',hotkeys.FULLSCREEN, function(){                    
            _fullscreen();
        });
        //TODO: add all shortcuts/hotkeys
    }

    function _switchLiveViewButton(enable) {
        if (enable) {
            $("button[data-action=editor-livepreview-toggle]").removeAttr("disabled").removeClass("disabled");            
        }
        else {            
            $("button[data-action=editor-livepreview-toggle]").attr("disabled", "disabled").addClass("disabled");
        }
    }
    
    function _fullscreen(){
        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }

    function _toggleLiveView(toggleLiveView) {
        var live_preview_toggle = $("button[data-action=editor-livepreview-toggle]");
        var live_preview_toggle_icon = $("button[data-action=editor-livepreview-toggle] i");
        //Show live preview
        if (toggleLiveView) {
            live_preview_toggle_icon.removeClass("icon-eye-close").addClass("icon-eye-open");
            live_preview_toggle.data("tooltip").options.title = "Turn Live Preview Off!";
            live_preview_toggle.attr("data-status", "on")
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
            
            var isCommentVisible = ($("#right-items").is(":visible"));
            if (isCommentVisible) {
                $("#right-items").hide("drop", {
                    direction : "right"
                }, 200);
            }
            
            //Expand Editor/Preview Area
            $("#editor-area").animate({
                width : $("#editor-area").width() + ((isCommentVisible) ? $("#right-items").usedWidth() : 0) - 10 + (!isCommentVisible? 10 : 0)
            }, {
                duration : 200,
                step : function(now, fx) {
                    $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
                    $(".CodeMirror").width($("#editor-area").width() / 2 - 5);
                    $("#live_preview_window").width($(".CodeMirror").width());
                    $("#live_preview_window").css({
                        left : $(".CodeMirror").width()
                    });
                }
            });

            $(".right-splitter-collapse-button").attr("data-action", "#show").css("left", "-2px");
            $(".right-splitter-collapse-button").data("tooltip").options.title = "Show Comments";
            $(".right-splitter-collapse-button").data("tooltip").options.placement = "left";

        }
        //Hide live preview
        else {
            $("button[data-action=editor-livepreview-toggle] i").removeClass("icon-eye-open").addClass("icon-eye-close");
            live_preview_toggle.data("tooltip").options.title = "Turn Live Preview On!";
            live_preview_toggle.attr("data-status", "off");
            //Remove Preview Area
            myCodeMirror.setOption("onChange", undefined);
            $("#live_preview_window").remove();

            var isCommentVisible = $(".right-splitter-collapse-button").attr("data-action") === "#hide";
            if (!isCommentVisible) {
                $("#right-items").show("drop", {
                    direction : "right"
                }, 200);
            }
            
            $("#editor-area").animate({
                width : $("#editor-area").width() - ((!isCommentVisible) ? $("#right-items").usedWidth() : 0) + 10 - (isCommentVisible? 10 : 0)
            }, {
                duration : 200,
                step : function(now, fx) {
                    $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
                    $(".CodeMirror").width($("#editor-area").width());
                }
            });

            $(".right-splitter-collapse-button").attr("data-action", "#hide").css("left", "-1px");
            $(".right-splitter-collapse-button").data("tooltip").options.title = "Hide Comments";
            $(".right-splitter-collapse-button").data("tooltip").options.placement = "top";
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
    
    $('#chatStart').click(function(){
        var pname = sessionStorage.getItem('project');
        chatWith('GroupChat');
    });
    
    function JumpSelectScroll(ln) {

    // editor.getLineHandle does not help as it does not return the reference of line.
    var ll = myCodeMirror.getLine(ln).length;
    myCodeMirror.setSelection({line:ln, ch:0}, {line:ln,ch:ll});    
    window.setTimeout(function() {
           myCodeMirror.setLineClass(ln, null, "top-me");
           var line = $('.CodeMirror-lines .top-me');
           var h = line.parent();
    
           $('.CodeMirror-scroll').scrollTop(0).scrollTop(line.offset().top - $('.CodeMirror-scroll').offset().top);
       }, 10);
    }
    
    // $('#commentStart').click(function(){
        // var pname = sessionStorage.getItem('project');
        // var ln = 70;                                                
        // JumpSelectScroll(ln);             
    // });        
        
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

    $(".right-splitter-collapse-button").tooltip({
        title : "Hide Comments"
    });

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
