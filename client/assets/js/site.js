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
  return name.join('');
};

  var templates = {
    error: '<a style="text-decoration:none;" data-line="%(line)s" href="javascript:void(0)">Line %(line)s, Character %(character)s</a>: ' +
           '<code>%(code)s</code><p style="color: #b94a48">%(msg)s</p>'
  };

  var editorMessage = {
    errorMessage : '<p style="color:#E62E00; text-align=center;">%(message)s</p>',
    successMessage : '<p style="color:#009933; text-align=center;">%(message)s</p>'
    
  };             
  
function _(string, context) {
    return string.replace(/%\(\w+\)s/g, function (match) {
      return context[match.slice(2, -2)];
    });
  }

  function escapeHTML(text) {
    var esc = text;
    var re  = [ [/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"] ];

    for (var i = 0, len = re.length; i < len; i++) {
      esc = esc.replace(re[i][0], re[i][1]);
    }

    return esc;
  }

  function listOptions(els, opts) {
    var str = '/*jshint ';

    for (var name in opts) {
      if (opts.hasOwnProperty(name)) {
        str += name + ':' + opts[name] + ', ';
      }
    }

    str = str.slice(0, str.length - 2);
    str += ' */';
    els.append(str);
  }

// PRAGA: generate CodeMirror Editor
function editor(id, mode) {
  var _editor = CodeMirror.fromTextArea(id, {
    mode : mode,
    lineNumbers : true,
    lineWrapping : true,
    extraKeys : {
      "'>'" : function(cm) {
        cm.closeTag(cm, '>');
      },
      "'/'" : function(cm) {
        cm.closeTag(cm, '/');
      },
      "Ctrl-Space" : "autocomplete"
    },
    syntax : 'html',
    profile : 'xhtml',
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

  errors[0].innerHTML = '';
  errors.append(_(editorMessage.errorMessage, {message: "JSHint has found " + report.errors.length + " potential problems in your code."}));
  for (var i = 0, err = report.errors[i]; i < report.errors.length ;i++) {
    errors.append(_('<li><p>' + templates.error + '</p></li>', {      
      line: err.line,
      character: err.character,
      code: $.trim(err.evidence) ? $.trim(escapeHTML(err.evidence)) : '',
      msg:  err.reason
    }));
 
    $('a[data-line=' + err.line + ']').bind('click', function (ev) {
      var line = $(this).attr('data-line') - 1;
      var str  = myCodeMirror.getLine(line);

      myCodeMirror.setSelection({line:line, ch:0}, {line:line, ch:str.length});
      //scrollTo(0, 0);
    });
  }
  $("#small-console").append(errors);
    $("#small-console").toggleClass("small-console-animated");
} 

function reportSuccess(report) {  
   var success = $("#small-console div");
   success[0].innerHTML = '';
   success.append(_(editorMessage.successMessage, {message: "Good job! JSHint hasn\'t found any problems with your code."})); 
   $("#small-console").append(success);
   $("#small-console").toggleClass("small-console-animated");
}
    
$.fn.usedWidth = function() {
  return $(this).width() + parseInt($(this).css('margin-left'), 10) + parseInt($(this).css('margin-right'), 10);
};

// layout    
var layout = function() {
  var _height = document.documentElement.clientHeight - $(".navbar").height() - 20; //Size of console when it's closed.
  $("#editor-area").height(_height);
  $("#left-items").height(_height);
  $(".left-splitter").height(_height);
  $(".right-splitter").height(_height);
  $(".left-splitter-collapse-button").css("margin-top", _height / 2);
  $(".right-splitter-collapse-button").css("margin-top", _height / 2);
  $(".tab-pane").css('height', _height - $(".nav .nav-pills").height());
  $("#right-items").height(_height);
  $("#editor-area").css('left',   $(".left-splitter").position().left + $(".left-splitter").usedWidth());  
  $("#editor-area").css('width', document.documentElement.clientWidth - ($("#right-items").is(':visible') ? 300 : 10 ) - ($("#left-items").is(':visible') ? $("#left-items").usedWidth() : 0) - $(".left-splitter").usedWidth() - $(".right-splitter").usedWidth());
  if ($("#left-items").is(':visible')) {
     if ($("#right-items").is(':visible')) {   
          $("#right-items").css('left', $("#left-items").usedWidth() + $('.left-splitter').usedWidth() + $("#editor-area").usedWidth() + $(".right-splitter").usedWidth());  
       $('.right-splitter').css('left', $("#left-items").usedWidth() + $('.left-splitter').usedWidth() + $("#editor-area").usedWidth());    
       $("#right-items").css('width', 300);
     } else {
       //$('.right-splitter').css('left', $("#left-items").usedWidth() + $('.left-splitter').usedWidth() + $("#editor-area").usedWidth());    
     }
  }  else{          
     if ($("#right-items").is(':visible')) {  
       $("#right-items").css('left', $('.left-splitter').usedWidth() + $("#editor-area").usedWidth() + $(".right-splitter").usedWidth());   
     } else {
       $('.right-splitter').css('left', $('.left-splitter').usedWidth() + $("#editor-area").usedWidth() + 4); 
     }   
  }
  _height = $("#editor-area").height() - $("#doc-tab").height() - parseInt($("#doc-tab").css('margin-bottom'), 10);
  $(".tab-content").height(_height);  
  
  myCodeMirror.refresh();
};

$(window).resize(function() {
  layout();
});

$(document).ready(function() {       
  $("#left-items").width($("#nav-tab").children(":first").width() * 4 + 7);
  $("#project-tree").treeview();
  $('#doc-tab a:first').tab('show');
  $('#nav-tab a:first').tab('show');
  $('#nav-tab a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
    var _class = $("#nav-tab li.active a i").attr('class');
    $("#nav-tab li.active a i").attr('class', _class + ' icon-white');
    $("#nav-tab li:not(.active) a i").each(function(e) {
      _tmp = $(this).attr('class');
      $(this).attr('class', _tmp.split(' ')[0]);
    });
  });
  $('#nav-tab a:first').click();

  $('.dropdown-toggle').dropdown();

  $("#new").bind('click', function() {
    console.log("click");
  });

  // set uo tooltip
  $(".left-splitter-collapse-button").tooltip({
    title: 'Hide'
  });

  $(".right-splitter-collapse-button").tooltip({
    title: 'Hide Comments'
  });

  $(".left-splitter-collapse-button").click(function() {
    if ($(this).attr('data-action') === '#hide') {
      $("#left-items").animate({'width': '0px', 'min-width': '0px'},
                            {
                              duration: 200,
                              step: function() {
                                $("#left-splitter").animate({'left': $("#left-items").width()});
                                _original_left = $("#editor-area").position().left;
                                _new_left = $(".left-splitter").position().left + $(".left-splitter").width();
                                $("#editor-area").css('left',   $(".left-splitter").position().left + $(".left-splitter").width());
                                $("#editor-area").css( 'width', parseInt($("#editor-area").css('width'), 10) + (_original_left - _new_left));
                              }
                            });
      $(this).attr('data-action', '#show').css('left','0px');
      $(".left-splitter-collapse-button").data('tooltip').options.title = 'Show'; 
      $(".left-splitter-collapse-button").data('tooltip').options.placement = 'right';
    } else {
      $("#left-items").animate({'width': $("#nav-tab").children(":first").width() * 4 + 7, 'min-width': '205px'},
                            {
                              duration: 200,
                              step: function() {
                                $("#left-splitter").animate({'left': $("#left-items").width()});
                                _original_left = $("#editor-area").position().left;
                                _new_left = $(".left-splitter").position().left + $(".left-splitter").width();
                                $("#editor-area").css('left',   $(".left-splitter").position().left + $(".left-splitter").width());
                                $("#editor-area").css( 'width', parseInt($("#editor-area").css('width'), 10) + (_original_left - _new_left));
                              }
                            });
      $(this).attr('data-action', '#hide').css('left','-1px');
      $(".left-splitter-collapse-button").data('tooltip').options.title = 'Hide';  
      $(".left-splitter-collapse-button").data('tooltip').options.placement = 'top';
    }
  });

  $(".right-splitter-collapse-button").click(function() {
    if ($(this).attr('data-action') === '#hide') {
      $("#right-items").hide('drop', { direction: "right" }, 1000);
      $("#editor-area").animate({'width': $("#editor-area").width() + $("#right-items").usedWidth() - 10},
                          {
                            duration: 500,
                            step: function(now, fx) {
                              $('.right-splitter').css('left', ($("#left-items").is(':visible') ? $("#left-items").usedWidth() : 0 ) + $('.left-splitter').usedWidth() + $("#editor-area").usedWidth());
                            } 
                          });

      $(this).attr('data-action', '#show').css('left','-2px');
      $(".right-splitter-collapse-button").data('tooltip').options.title = 'Show Comments'; 
      $(".right-splitter-collapse-button").data('tooltip').options.placement = 'left';
    } else {
      $("#right-items").show('drop', { direction: "right" }, 500);
      $(this).attr('data-action', '#hide').css('left','-1px');
      $(".right-splitter-collapse-button").data('tooltip').options.title = 'Hide Comments';
      $(".right-splitter-collapse-button").data('tooltip').options.placement = 'top';  
      $("#editor-area").animate({'width': $("#editor-area").width() - $("#right-items").width() + 10},
                                {
                                  duration: 500,
                                  step: function(now, fx) {
                                    $('.right-splitter').css('left', ($("#left-items").is(':visible') ? $("#left-items").usedWidth() : 0 ) + $('.left-splitter').usedWidth() + $("#editor-area").usedWidth());
                                  } 
                                } );
    }
  });

  // set up CodeMirror editor
  var elem = document.getElementById("home");
  CodeMirror.commands.autocomplete = function(cm) {
    var mode = cm.getOption('mode');

    if (mode == 'htmlmixed') {
      CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
      CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
    } else if (mode == 'text/html' || mode == 'xml') {
      CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
    } else if (mode == 'javascript') {
      CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
    }
  };
  var myCodeMirror = editor(elem, "text/html");
  CodeMirror.commands.selectAll(myCodeMirror);
  
  
  window.myCodeMirror = myCodeMirror;
  // set up layout
  layout();
  
  // TODO: sharejs
  // generate document name
  //var docId;
  //if (!document.location.hash) {
    //docId = '#' + randomDocName();
  //} else {
    //docId = document.location.hash;
  //}

  //localStorage.setItem('docId', docId);
  // connect to shareJs server to synchronize code
  //sharejs.open(docName, 'text', function(error, doc) {
    //if (error) {
      //console.error(error);
      //return;
    //}
    //elem.disabled = false;
    //doc.attach_cm(myCodeMirror);
  //});
  
  // === Start menu bar
  $("a[data-action=editor-new-file]").click(function() {
    $("#dialog").attr('title', 'New File');
    var dialogContent= '<div style="margin: 0 auto">' +
      '<select>' +
      '<option ><a href="#"></a></option>' +
      '<option value=".html"><a href="#">HTML</a></option>' +
      '<option value=".js"><a href="#">JavaScript</a></option>' +
      '<option value=".css"><a href="#">CSS</a></option>' +
      '</select>' +
      '<input type="text" placeholder="Enter file name" width="100%"></input>' +
      '</div>';
     $("#dialog").html(dialogContent);
      $("#dialog").dialog({
      show : "blind",
      hide : "blind",
      buttons: [
        {
          text: 'Create',
          click: function() {
            // TODO: check file exist or not
           $('#doc-tab li.active').removeClass('active');
           var _docId =  randomDocName();      
           var patt = /\.([0-9a-z]+)(?:[\?#]|$)/i;
           var mat = $('div input').val().match(patt);  
           var _fileName = $('div input').val().substring(0, mat.index);     
           var _fileType = mat[1];
           var _tab_link = $('<a>').attr({href: "#" + _fileName, 'data-file-type': _fileType, 'data-docId': "#" + _docId, 'data-toggle': "tab"}).text(_fileName).click(function(e) {
               e.preventDefault();
                $(this).tab('show'); 
            });

           _tab = $('<li>').append(_tab_link).addClass('active');
           $("#doc-tab").append(_tab);

           //_div_textarea = $('<div>').addClass('tab-pane fade').attr('id', _fileName).append($('<textarea>').attr('id', _fileName));
           _div_textarea = $('<textarea>').attr({'id': _fileName, 'class':"tab-pane fade"});
           $('#doc-tab').parent().children('.tab-content').append(_div_textarea);
           //window.myCodeMirror = editor(document.getElementById(_fileName), 'javascript');
           //CodeMirror.commands.selectAll(myCodeMirror);
           //$('#doc-tab').tab(); 
           //_tab_link.click();
           //setTimeout(myCodeMirror.refresh(), 1);
           sharejs.open(_docId, 'text', function(error, doc) {
              if (error) {
                console.error(error);
                return;
              }
              elem.disabled = false;
              doc.attach_cm(myCodeMirror);
            });

           $(this).dialog("close"); 
          }
        },
        {
          text: 'Cancel',
          click: function() { $(this).dialog("close"); }
        }
      ],
      create: function (){
        $('div select').change(function() {
         $('div input').val($('div select option:selected').val());
         $('div input').focus();
         $('div input')[0].setSelectionRange(0, 0);
        });
      },
      modal : true
    });
    $(".ui-dialog-buttonset button").addClass('btn btn-inverse');
  });

  $("a[data-action=editor-new-project]").click(function() {
    var dialogContent = '<input type="text" placeholder="Enter project name" width="100%"/>';
    $("#dialog").html(dialogContent);
      $("#dialog").dialog({
      show : "blind",
      hide : "blind",
      buttons: [
        {
          text: 'Create',
          click: function(){
            if ($('#dialog input').val() === '') {
              var error_msg = '<div class="alert alert-error">' +
                '<button class="close" data-dismiss="alert">×</button>' +
                'Please enter a valid name for your project.' +
                '</div>';
              if (!$('#dialog .alert')[0])
                $("#dialog").append(error_msg);
            } else {
              var html_folder = $('<ul>').append($("<li>").append($('<span>').addClass('folder').text('html')));
              var css_folder = $('<ul>').append($("<li>").append($('<span>').addClass('folder').text('css')));
              var js_folder = $('<ul>').append($("<li>").append($('<span>').addClass('folder').text('js')));
              var li = $("<li>").append($('<span>').addClass('folder').text($('#dialog input').val())).append(html_folder).append(css_folder).append(js_folder);



              $("#browser").append(li);
              $("#browser").treeview();
              $(this).dialog("close");
            }
          }
        },
        {
          text: 'Cancel',
          click: function() { $(this).dialog("close"); }
        }
      ],
      modal: true
    });
    $(".ui-dialog-buttonset button").addClass('btn btn-inverse');
  });

  $("a[data-action=editor-share-code]").click(function() {
    $("#dialog").attr('title', 'Share via this link');
    var dialogContent = "<table style='width:100%'><tr><td>" + document.location.origin + localStorage.getItem('docId') + "</td><tr><td><input id='collaboratorEmail' style='width:100%; margin:5px 0px 5px 0px' type='email' placeholder='Enter a valid email address'></input></td></tr><tr><td align='center'><button role='button' id='shareDocOrig' style='margin:5px 0px 5px 0px' class='btn btn-inverse'><span class='ui-button-text'>Share</span></button></td></tr></table>";
    $("#dialog").html(dialogContent);
    $("#dialog").dialog({
      show : "blind",
      hide : "blind",
      modal : true,
      buttons: []
    });
    $(".ui-dialog-buttonset button").addClass('btn btn-inverse');
  });
  
  function checkQuality(){
    var options = {"debug":true,"forin":true,"eqnull":true,"noarg":true,"noempty":true,"eqeqeq":true,"boss":true,"loopfunc":true,"evil":true,"laxbreak":true,"bitwise":true,"strict":false,"undef":true,"curly":true,"nonew":true,"browser":true,"devel":false,"jquery":true,"es5":false,"node":true};
    if(JSHINT(myCodeMirror.getValue(), options))
      reportSuccess(JSHINT.data());
    else
      reportFailure(JSHINT.data());
    showConsole($("#small-console a"));
  }
  
  $("a[data-action=editor-comment-selected]").click(function(){
    commentSelection(true);
  });
  
  $("a[data-action=editor-uncomment-selected]").click(function(){
    commentSelection(false);
  });
  
  $("a[data-action=editor-format-selected-code]").click(function(){
    autoFormatCode();
  });

  $("a[data-action=editor-check-quality]").click(function(){        
    checkQuality();
  });
  // === End menu bar

  // PRAGA: console
  // === Start console
  $("a[data-action=editor-console-toggle]").tooltip({
      title: 'Show Console',
      placement: 'left'
  });
  
  function showConsole(consoleToggle){
    $("#small-console").css({bottom: 180,height: 200});
      $(consoleToggle).attr('href', '#hide');
      $("a[data-action=editor-console-toggle]").data('tooltip').options.title = 'Hide Console';
      $("a[data-action=editor-console-toggle] i").attr('class', 'icon-chevron-down icon-white pull-right');
        var _div = $("#small-console div").css({display: 'block', position: 'relative',
               'overflow-y': 'scroll',
                '-webkit-transition': 'all .5s ease',
                'background': '-webkit-linear-gradient(top, rgba(242,242,242,1) 0%,rgba(193,193,189,1) 100%)',
                'padding-left': '25px',
                'padding-top': '5px',
                'margin-left': '25px',
                'margin-right':'-20px',
                height: 180, top: 20,
               opacity: 0.85}); 
      $("#small-console").toggleClass("small-console-animated");   
  }

    function hideConsole(consoleToggle){
      $("a[data-action=editor-console-toggle]").data('tooltip').options.title = 'Show Console';
        $("#small-console").css({ bottom: 0});
        $(consoleToggle).attr('href', '#show');             
        $("a[data-action=editor-console-toggle] i").attr('class', 'icon-chevron-up icon-white pull-right');            
    }

  $("a[data-action=editor-console-toggle]").click(function(){
    if($(this).attr('href') === '#show' )
      showConsole($(this));
    else
     hideConsole($(this));
  });
  
  $("a[data-action=editor-console-clean]").tooltip({
      title: 'Clean Console',
      placement: 'left'
  });
 
  $("a[data-action=editor-console-clean]").click(function(){
    var consoleDiv = $("#small-console div");
    if(consoleDiv[0].innerHTML !== "")
      consoleDiv[0].innerHTML = "";
  });
  // === End console

  // bind event editor
  $('#doc-tab a').click(function(e) {
    e.preventDefault();
   $(this).tab('show'); 
  });

  function getSelectedRange() {
    return {
      from : myCodeMirror.getCursor(true),
      to : myCodeMirror.getCursor(false)
    };
  }
  
  function autoFormatCode() {
    if(!myCodeMirror.somethingSelected()) {       
      var lineCount = myCodeMirror.lineCount();
      var lastLineLength = myCodeMirror.getLine(lineCount-1).length;
      myCodeMirror.setSelection({line:0,ch:0},{line:lineCount,ch:lastLineLength});
    }
      var range = getSelectedRange();
      myCodeMirror.autoFormatRange(range.from, range.to);   
  }
  
  function commentSelection(isComment) {
    var range;
    if(myCodeMirror.somethingSelected()){
      if(isComment){
        range = getSelectedRange();
        myCodeMirror.commentRange(isComment, range.from, range.to);         
      } 
      else{
        var selectedText = myCodeMirror.getSelection();
        //html, js comment block
        if((/<!--[\s\S]*?-->/g).test(myCodeMirror.getSelection()) || (/\/\*([\s\S]*?)\*\//g).test(myCodeMirror.getSelection())){
          range = getSelectedRange();
          myCodeMirror.commentRange(false, range.from, range.to); 
        }   
        else {
          var uncomment_error = $("#small-console div");
          uncomment_error[0].innerHTML = '';
          uncomment_error.append(_(editorMessage.errorMessage, {message: "Selected text is not a comment to be uncommented. Please select a commented text block to uncomment."}));                   
          $("#small-console").toggleClass("small-console-animated");
          showConsole($("a[data-action=editor-console-toggle]"));           
        }   
      }     
      
    }
    else {      
      var comment_error = $("#small-console div");
      comment_error[0].innerHTML = '';
      if(isComment)
        comment_error.append(_(editorMessage.errorMessage, {message: "Please select uncommented text you want to comment."}));
      else
        comment_error.append(_(editorMessage.errorMessage, {message: "Please select commented text you want to uncomment."})); 
      $("#small-console").toggleClass("small-console-animated");
      showConsole($("a[data-action=editor-console-toggle]"));
    }
  }
});
