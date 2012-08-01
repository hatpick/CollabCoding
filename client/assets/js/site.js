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
  _height = document.documentElement.clientHeight - $(".navbar").height() - 40;
  $("#editor-area").height(_height);
  $("#left-items").height(_height);
  $("#right-items").css('left', $(".span8").position().left + $(".span8").width() + 15);
  _height = $("#tabs").height() - $(".ui-tabs-nav").height() - 10;
  $(".CodeMirror-scroll").css("height", _height);
  myCodeMirror.refresh();


};

$(window).resize(function(){
  layout();
});

$(document).ready(function() {
	$("#project-tree").treeview();
	$("#nav-tabs").tabs();
	$("#tabs").tabs();

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
    mode:  "htmlmixed",
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
		//$("#dialog").dialog();
		$("#dialog").dialog({					
			show: "blind",
			hide: "explode",
			position: "top"									
		});				
	});
});