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
};

$(window).resize(function() {
  layout();
});

$(document).ready(function() {
  window.doc = null;
  // TODO 
  $('#browser').bind('click', function() {
    console.log($.jstree._focused().get_selected());
    var reg = /^file.*/;
    
    if (reg.test($.jstree._focused().get_selected().attr('rel'))) {
      var file_type = $.jstree._focused().get_selected().attr('rel');
      var mode = "text/html";
      if(file_type === "file-js")
        mode = "javascript";
      else if(file_type === "file-css")
        mode = "css"
      $('.breadcrumb').empty();
      var paths = $.jstree._focused().get_path();
      var li;
      for ( var i=0; i < paths.length - 1; i++ ) {
        li = $('<li>').append($('<a>').attr('href', '#').html(paths[i]).click(function() {
          $.jstree._reference('#browser').select_node($('#'+$(this).text() + '_id'), true);
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
        if (doc !== null ) {
           doc.close();
           doc.detach_codemirror();
        };
        doc = newdoc;
        doc.attach_codemirror(myCodeMirror);            
      });  
      if ($(".CodeMirror.CodeMirror-wrap").size() > 1) {
        $($(".CodeMirror.CodeMirror-wrap")[1]).remove();
      }   
      $(".CodeMirror-wrap").height($("#project").height());  
      window.myCodeMirror = myCodeMirror;
    }    
  });
        
  function _createJsTree(tree_data){ 
    $("#browser").jstree({
      "unique" : {
                  "error_callback" : function (n, p, f) {
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
                  $.post('/project/' + project_name + '/rename', {
                    old_name: obj.old_name,
                    new_name: obj.new_name
                  },
                  function(data) {
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
        rel : 'root',
        id: _data.name + '_id'
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
              rel: rel,
             id: key + '_id'
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
                 rel: 'folder',
                 id: ele.name + '_id'
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
    return { data: ele.name,
              attr: {
                rel: rel,
                id: ele.name + '_id',
                'data-shareJSId': ele.shareJSId
              }};  
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
             rel: rel,
             id: ele.name + '_id',
             'data-shareJSId': ele.shareJSId             
           }
         });
       } else {
         children.push(
           {
              data: ele.name,
              attr: {
                rel: 'folder',
                id: ele.name + '_id'                
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
      // FIXME: b
      $.get('/project', {name: sessionStorage.getItem('project')}, function(data) {
        createJsTreeByJSON(data);
      })
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
  
  function cleanSessionStorage() {
    sessionStorage.removeItem('project');
    sessionStorage.removeItem('docName');
  };

  $("#left-items").width($("#nav-tab").children(":first").width() * 4 + 7);
  $("#project-tree").jstree();
  // $("#doc-tab a:first").tab("show");
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
    window.location.href='/logout'
  });
  
  $("a[data-action=editor-new-file]").click(function() {
    createFile(this);
  }); 
  $("a[data-action=editor-new-project]").click(function() {
    // TODO: pop up a window, asking user close/save current project
    var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>New Project</p>";
    var dialogContent = '<input type="text" id="project_name" placeholder="Enter project name" width="100%" required/><br/><input type="text" id="users" width="100%" required/>';

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
        var users = $("#as-selections-users_list").children().text().split("×");
        users.shift();
        $.post("/project/new", {
          pname : project_name,
          users: users
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
    
    $("#users").autoSuggest("http://localhost:8001/users/list", {selectedItemProp: "name", searchObjProps: "name",selectedValuesProp: "user", selectionLimit: 5,startText: "Add user name here", asHtmlID: "users_list"} );
    $("#dialog").modal();
  });
  $("a[data-action=editor-open-project]").click(function() {  
    // fetch project list
    $.get('/project/list', function(projects) {
      var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>Open Project</p>";
      var project_table = $('<table>').attr({'class': 'table table-striped table-bordered'});
      project_table.html('<thead><tr><th>#</th><th>Project Name</th><th>Created On</th><th>Last Modified On</th></tr></thead>');
      var tbody = $('<tbody>');
      var tr;
      for ( var i=0; i < projects.length; i++ ) {
        tr = $('<tr>');                                                                        
        tr.append(
            $('<td>').html(i+1)
           )
          .append(
            $('<td>').append($('<a>').attr('href','#').append(projects[i].name).click(function() {
               // TODO: pop up close alert  
               sessionStorage.setItem('project', $(this).text());
               $.get('/project', {name: sessionStorage.getItem('project')}, function(data) {
                 createJsTreeByJSON(data);
                 $("#dialog").modal('hide');
               });
             })))
          .append($('<td>').html(projects[i].created_on))
          .append($('<td>').html(projects[i].last_modified_on));
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
    
  })
  $("a[data-action=editor-share-code]").click(function() {
    var dialogHeader = "<button type='button' class='close' data-dismiss='modal'>×</button><p>Share via this link</p>";
    var project_name = sessionStorage.getItem("project");
    var doc_shareJSId = sessionStorage.getItem("docName");
    var dialogContent = $("<div>").append($("<p>").text(document.location.origin + "/" +  project_name + "/" + doc_shareJSId)).append($("<p>").attr("margin-bottom","5px").append($('<input>').attr({type:"text", id:"collaboratorEmail", placeholder:"Enter a valid username", width:"100%", required:true})));

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
    document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  });
  
  $("a[data-action=editor-console-toggle]").click(function() {
    if ($(this).attr("href") === "#show")
      showConsole($(this));
    else
      hideConsole($(this));
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
