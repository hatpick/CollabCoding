var randomDocName = function(length) {
	var chars, x;
	if (length == null) {
		length = 10;
	}
	chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-=";
	var name = [];
	for ( x = 0; x < length; x++) {
		name.push(chars[Math.floor(Math.random() * chars.length)]);
	}
	return name.join('');
};

var layout = function (){
  // layout
  _height = document.documentElement.clientHeight - $(".navbar").height();
  $("#editor-area").height(_height);
  $("#left-items").height(_height);
  $("#editor-area").css('left', $("#left-items").position().left + $("#left-items").width());
  $("#right-items").css('left', $("#editor-area").position().left + $("#editor-area").width());
  $("#comment").css('left', $("#editor-area").position().left + $("#editor-area").width());
  _height = $("#tabs").height() - $(".ui-tabs-nav").height() - 10;
  //$("body").width(parseInt($("#left-items").css('margin-left'), 10) +  parseInt($("#right-items").css('margin-left'), 10) + $("#right-items").position().left + $("#right-items").width());
  //$(".container-fluid").width(parseInt($("#left-items").css('margin-left'), 10) +  parseInt($("#right-items").css('margin-left'), 10) + $("#right-items").position().left + $("#right-items").width());
  $(".CodeMirror-scroll").css("height", _height);
  myCodeMirror.refresh();
};

$(window).resize(function(){
  layout();
});

$(document).ready(function() {
	$("#project-tree").treeview();
  $('#doc-tab a:first').tab('show'); 
  $('#nav-tab a:first').tab('show'); 
  $('#nav-tab a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    _class = $("#nav-tab li.active a i").attr('class');
    $("#nav-tab li.active a i").attr('class', _class + ' icon-white');
    $("#nav-tab li:not(.active) a i").each(function(e) {
      _tmp = $(this).attr('class');
      $(this).attr('class',  _tmp.split(' ')[0]);
    });
  });
  $('#nav-tab a:first').click();

  $('.dropdown-toggle').dropdown();

	$("#new").bind('click', function() {
		console.log("click");
  });

  // set up editor
  var elem = document.getElementById("editor");
  CodeMirror.commands.autocomplete = function(cm) {
    var mode = cm.getOption('mode');
		
    if(mode == 'htmlmixed') {
      CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
      CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
      //CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
    } else if (mode == 'text/html' || mode == 'xml') {
      CodeMirror.simpleHint(cm, CodeMirror.htmlHint);
    } else if (mode == 'javascript') {
      CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
    }
  };
  var myCodeMirror = CodeMirror.fromTextArea(elem, {
    mode: "text/html",
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {
      "'>'" : function(cm) {cm.closeTag(cm, '>');},
      "'/'" : function(cm) {cm.closeTag(cm, '/');},
      "Ctrl-Space": "autocomplete"
    }
  }); 
  window.myCodeMirror = myCodeMirror;
  // set up layout
  layout();

  // generate document name
	var docName;
	if (!document.location.hash) {
		docName = '#' + randomDocName();
	} else {
		docName = document.location.hash;
	}

  // connect to shareJs server to synchronize code
	sharejs.open(docName, 'text', function(error, doc) {
		if (error) {
			console.error(error);
			return;
		}
    elem.disabled = false;
		doc.attach_textarea(elem);
	});
	// binding event
	$("#shareDoc").click(function() {
		$("#dialog").attr('title', 'Share via this link');				
		var dialogContent = "<table style='width:100%'><tr><td>" + document.location.origin + docName + "</td><tr><td><input id='collaboratorEmail' style='width:100%; margin:5px 0px 5px 0px' type='email' placeholder='Enter a valid email address'></input></td></tr><tr><td align='center'><button role='button' id='shareDocOrig' style='margin:5px 0px 5px 0px' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Share</span></button></td></tr></table>";
		$("#dialog").html(dialogContent);
		$("#dialog").dialog({					
			show: "blind",
			hide: "explode",
			position: "top",
      modal: true
		});				
	});
});
