(function() {
  var Collabcoding = {
    tree_data: {}
  };
  window.Collabcoding = Collabcoding;
})(window);

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
  return _editor;
}

function reportFailure(report) {
  var errors = $("#small-console div");
  var item;
  errors[0].innerHTML = "";
  errors.append(_(editorMessage.errorMessage, {
    message : "JSHint has found " + report.errors.length + " potential problems in your code."
  }));
  for (var i = 0, err = report.errors[i]; i < report.errors.length; i++) {
    errors.append(_("<li><p>" + templates.error + "</p></li>", {
      line : err.line,
      character : err.character,
      code : $.trim(err.evidence) ? $.trim(escapeHTML(err.evidence)) : "",
      msg : err.reason
    }));
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

var randomDocName = function(length) {
  var chars, x;
  if (!length) {
    length = 10;
  }
  chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-=";
  var name = [];
  for ( x = 0; x < length; x++) {
    name.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return name.join("");
};

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

var layout = function() {
  var _height = document.documentElement.clientHeight - $(".navbar").height() - 20;
  $("#editor-area").height(_height);
  $("#left-items").height(_height);
  $(".left-splitter").height(_height);
  $(".right-splitter").height(_height);
  $(".left-splitter-collapse-button").css("margin-top", _height / 2);
  $(".right-splitter-collapse-button").css("margin-top", _height / 2);
  $(".tab-pane").css("height", _height - $(".nav .nav-pills").height());
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
  _height = $("#editor-area").height() - $("#doc-tab").height() - parseInt($("#doc-tab").css("margin-bottom"), 10);
  $(".tab-content").height(_height);
  myCodeMirror.refresh();
};

$(window).resize(function() {
  layout();
});

$(document).ready(function() {
  // TODO 
  $('#browser').bind('click', function() {
    console.log($.jstree._focused().get_selected());
  });
        
  function _createJsTree(tree_data){ 
    Collabcoding.tree_data = tree_data;
    $("#browser").jstree({
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
      plugins : ["themes", "json_data", "contextmenu", "types", "crrm", "ui"],    
      contextmenu : {
        select_node: true,
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
                  }
                }
              }
            },
            rename : {
              separator_before : false,
              separator_after : false,
              label : "Rename",
              action : function(obj) {
                this.rename(obj, function(obj){
                  console.log(obj);
                  var project_name = sessionStorage.getItem('project'); 
                  $.post('/project/' + project_name + '/rename', obj,
                  function() {
                    
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
  
  function createJsTreeByJSON(_data){
    var rel, ele, reg;
    var tree_data = {
      attr : {
        rel : 'root'
      },
      data: _data.name,
      children:[],
      state : "open"
     };          
     
     for (var key in _data.root) {
       if (key !== 'files') {
         if (key == 'html' || key == 'css' || key == 'js') 
          rel = 'folder-' + key;
         else 
          rel = 'folder';
          var folder = {
            data: key,
            attr: {
              rel: rel
            },
            children: [],
            state : "open"
          };
          for ( var i=0; i < _data.root[key].length; i++ ) {
           ele = _data.root[key][i];
           if (ele.type == 'file') { 
             folder.children.push(_generateFileChildren(ele));
           } else {  
             folder.children.push({
               data: ele.name,
               attr: {
                 rel: 'folder'
               },
               children: _generateChildren(ele.children),
               state : "open"
             });
           }
          } 
          tree_data.children.push(folder); 
       } else {
         for ( var i=0; i < _data.root[key].length; i++ ) {
           ele =  _data.root[key][i];
           tree_data.children.push(_generateFileChildren(ele));
         }
       } 
       
     }
     console.log(tree_data);
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
    return { data: ele.name, attr: { rel: rel}};  
  };
  
  function _generateChildren(folder) {
    var ele;
    var children = [];
    for ( var i=0; i < folder.length; i++ ) {
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
           data: ele.name,
           attr: {
             rel: rel
           }
         });
       } else {
         children.push(
           {
              data: ele.name,
              attr: {
                rel: 'folder'
              },
              children: _generateChildren(ele.children),
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
      // save file 
      $.post('/project/' + project_name + '/new', {
        paths: paths,
        name: file_name,
        type: 'file'
      }, function() {
        console.log('success create file: ' + file_name);
      },'json');
      
      if (!reg.test($("div input").val())) {
        return;
      }
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
        attr: {rel: type}
      }, function(o) { 
        Collabcoding.tree_data = this. get_json()[0];
      }, true);
      
      
      $("#dialog").modal('hide');
    }));

    $(".modal-header").html(dialogHeader);
    $(".modal-body").html(dialogContent);
    $(".modal-footer").html(dialogFotter);
    $("#dialog").modal();
  }

  function createFolder(ele) {
    var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Folder</p>";
    var dialogContent = $("<div>").css({
      "margin" : "0 auto"
    }).append($("<p>").append($("<input>").attr({
      type: "text",
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
       paths: paths,
       name: folder_name,
       type: 'folder'
     }, function() {
       console.log('success create folder: ' + folder_name);
     }, 'json');
                
     
     // create
     $("#browser").jstree("create", ele, "last", {
       data : $(".modal-body input").val(),
       attr: {rel: 'folder'}
     }, function(o) { 
       Collabcoding.tree_data = this. get_json()[0];
     }, true);
     
     $("#dialog").modal('hide');
    }));
    $(".modal-header").html(dialogHeader);
    $(".modal-body").html(dialogContent);
    $(".modal-footer").html(dialogFotter);
    $("#dialog").modal();
  }
      
  function openProject() {
    // TODO
    // fetch project list
    
  };

  $("#left-items").width($("#nav-tab").children(":first").width() * 4 + 7);
  $("#project-tree").jstree();
  $("#doc-tab a:first").tab("show");
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

  $(".left-splitter-collapse-button").tooltip({
    title : "Hide"
  });
  $(".right-splitter-collapse-button").tooltip({
    title : "Hide Comments"
  });
  $(".left-splitter-collapse-button").click(function() {
    if ($(this).attr("data-action") === "#hide") {
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
          $("#editor-area").css("width", parseInt($("#editor-area").css("width"), 10) + (_original_left - _new_left));
        }
      });
      $(this).attr("data-action", "#show").css("left", "0px");
      $(".left-splitter-collapse-button").data("tooltip").options.title = "Show";
      $(".left-splitter-collapse-button").data("tooltip").options.placement = "right";
    } else {
      $("#left-items").animate({
        width : $("#nav-tab").children(":first").width() * 4 + 7,
        "min-width" : "205px"
      }, {
        duration : 200,
        step : function() {
          $("#left-splitter").animate({
            left : $("#left-items").width()
          });
          _original_left = $("#editor-area").position().left;
          _new_left = $(".left-splitter").position().left + $(".left-splitter").width();
          $("#editor-area").css("left", $(".left-splitter").position().left + $(".left-splitter").width());
          $("#editor-area").css("width", parseInt($("#editor-area").css("width"), 10) + (_original_left - _new_left));
        }
      });
      $(this).attr("data-action", "#hide").css("left", "-1px");
      $(".left-splitter-collapse-button").data("tooltip").options.title = "Hide";
      $(".left-splitter-collapse-button").data("tooltip").options.placement = "top";
    }
  });
  $(".right-splitter-collapse-button").click(function() {
    if ($(this).attr("data-action") === "#hide") {
      $("#right-items").hide("drop", {
        direction : "right"
      }, 1e3);
      $("#editor-area").animate({
        width : $("#editor-area").width() + $("#right-items").usedWidth() - 10
      }, {
        duration : 200,
        step : function(now, fx) {
          $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
        }
      });
      $(this).attr("data-action", "#show").css("left", "-2px");
      $(".right-splitter-collapse-button").data("tooltip").options.title = "Show Comments";
      $(".right-splitter-collapse-button").data("tooltip").options.placement = "left";
    } else {
      $("#right-items").show("drop", {
        direction : "right"
      }, 200);
      $(this).attr("data-action", "#hide").css("left", "-1px");
      $(".right-splitter-collapse-button").data("tooltip").options.title = "Hide Comments";
      $(".right-splitter-collapse-button").data("tooltip").options.placement = "top";
      $("#editor-area").animate({
        width : $("#editor-area").width() - $("#right-items").usedWidth() + 10
      }, {
        duration : 200,
        step : function(now, fx) {
          $(".right-splitter").css("left", ($("#left-items").is(":visible") ? $("#left-items").usedWidth() : 0) + $(".left-splitter").usedWidth() + $("#editor-area").usedWidth());
        }
      });
    }
  });
  
  // CodeMirror
  var elem = document.getElementById("home");
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
  var myCodeMirror = editor(elem, "text/html");
  CodeMirror.commands.selectAll(myCodeMirror);
  window.myCodeMirror = myCodeMirror;
  layout();
  
  // FIXME: here for test project tree. After finished, reomve it.  
  $.get('/project', {name: 'test'}, function(data) {
    sessionStorage.setItem('project', 'test');
    createJsTreeByJSON(data);
  })

  $(".btn-logout").click(function() {window.location.href='/logout'});
  
  
  $("a[data-action=editor-new-file]").click(function() {
    createFile(this);
  }); 
  
  $("a[data-action=editor-new-project]").click(function() {
    // TODO: pop up a window, asking user close/save current project
    var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Project</p>";
    var dialogContent = '<input type="text" id="project_name" placeholder="Enter project name" width="100%" required/>';

    var dialogFotter = $("<div>").append($("<button>").attr({
      class : "btn btn-primary",
      type: 'submit'
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
        $.post("/project/new", {
          pname : project_name 
        }, function() {
          console.info("success create" + $("#project_name").val());
        });
        createNewJsTree($("#dialog input").val());
        $("#dialog").modal('hide');
      }
    })).append($("<button>").attr({
        class : "btn",    
        type: 'button',
        "data-dismiss" : "modal"
      }).text("Cancel"));
    $(".modal-header").html(dialogHeader);
    $(".modal-body").html(dialogContent);
    $(".modal-footer").html(dialogFotter);
    $("#dialog").modal();
  });
  $("a[data-action=editor-share-code]").click(function() {
    var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>Share via this link</p>";
    var dialogContent = $("<div>").append($("<p>").text(document.location.origin + localStorage.getItem("docId"))).append($("<p>").attr("margin-bottom","5px").append($('<input>').attr({type:"text", id:"collaboratorEmail", placeholder:"Enter a valid email address", width:"100%", required:true})));

    var dialogFotter = $("<div>").append($("<a>").attr({
      class : "btn",
      "data-dismiss" : "modal"
    }).text("Cancel")).append($("<a>").attr({
      class : "btn btn-primary"
    }).text("Share").click(function() {
      //TODO: Send Email      
    }));
    
    $(".modal-header").html(dialogHeader);
    $(".modal-body").html(dialogContent);
    $(".modal-footer").html(dialogFotter);
    $("#dialog").modal();               
  });
  
  $("button[data-action=editor-livepreview-toggle]").tooltip({
    title : "Turn Live Preview On!",
    placement : "bottom"
  });
  
  $("button[data-action=editor-livepreview-toggle]").click(function(){
    var live_preview_toggle = $("button[data-action=editor-livepreview-toggle]");
    var live_preview_toggle_icon = $("button[data-action=editor-livepreview-toggle] i");
    
    if(live_preview_toggle.attr("data-status") === 'off'){
      live_preview_toggle_icon.removeClass("icon-eye-close").addClass("icon-eye-open");
      live_preview_toggle.data("tooltip").options.title = "Turn Live Preview Off!";
      live_preview_toggle.attr("data-status","on")
      //TODO: Hide comment area on right and split editor area into two equal sections
    }
    else {
      $("button[data-action=editor-livepreview-toggle] i").removeClass("icon-eye-open").addClass("icon-eye-close");
      live_preview_toggle.data("tooltip").options.title = "Turn Live Preview On!";
      live_preview_toggle.attr("data-status","off")
      //TODO: Merge equal sections in editor area and show comments
    } 
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
  
  $("a[data-action=editor-console-toggle]").tooltip({
    title : "Show Console",
    placement : "left"
  });   
  
  $("a[data-action=editor-console-toggle]").click(function() {
    if ($(this).attr("href") === "#show")
      showConsole($(this));
    else
      hideConsole($(this));
  });
  $("a[data-action=editor-console-clean]").tooltip({
    title : "Clean Console",
    placement : "left"
  });
  $("a[data-action=editor-console-clean]").click(function() {
    var consoleDiv = $("#small-console div");
    if (consoleDiv[0].innerHTML !== "")
      consoleDiv[0].innerHTML = "";
  });
  $("#doc-tab a").click(function(e) {
    e.preventDefault();
    $(this).tab("show");
  });
});

