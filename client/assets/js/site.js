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

  var templates = {
    error: '<a data-line="%(line)s" href="javascript:void(0)">Line %(line)s</a>: ' +
           '<code>%(code)s</code></p><p>%(msg)s'
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


  function reportFailure(report) {
    var errors = $('<div>');
    var item;

    errors[0].innerHTML = '';
    for (var i = 0, err; err = report.errors[i]; i++) {
      errors.append(_('<li><p>' + templates.error + '</p></li>', {
        line: err.line,
        code: err.evidence ? escapeHTML(err.evidence) : '',
        msg:  err.reason
      }));
   
      //$('a[data-line="' + err.line + '"]').bind('click', function (ev) {
        //var line = $(ev.target).attr('data-line') - 1;
        //var str  = myCodeMirror.getLine(line);

        //myCodeMirror.setSelection({ line: line, ch: 0 }, { line: line, ch: str.length });
        ////scrollTo(0, 0);
      //});
    }
    console.log(errors);
    $('#small-console').append(errors);
    //listOptions($('div.report > div.error > div.options pre'), report.options);
    //$('div.editorArea div.alert-message.error').show();
    //$('div.report > div.error').show();
  }

function reportSuccess(report) {
  $('div.editorArea div.alert-message.success').show();
}

var layout = function() {
	// layout
	_height = document.documentElement.clientHeight - $(".navbar").height() - $("#small-console").height();
	$("#editor-area").height(_height);
	$("#left-items").height(_height);
	$("#right-items").height(_height);
	$("#editor-area").css('left', $("#left-items").position().left + $("#left-items").width());
	$("#right-items").css('left', $("#left-items").width() + $("#editor-area").width());
	_height = $(".tabbable").height() - $("#doc-tab").height() - parseInt($("#doc-tab").css('margin-bottom'), 10);
  $(".tab-content").height(_height);
	myCodeMirror.refresh();
};

$(window).resize(function() {
	layout();
});

$(document).ready(function() {
	$("#project-tree").treeview();
	$('#doc-tab a:first').tab('show');
	$('#nav-tab a:first').tab('show');
	$('#nav-tab a').click(function(e) {
		e.preventDefault();
		$(this).tab('show');
		_class = $("#nav-tab li.active a i").attr('class');
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

	// set up editor
	var elem = document.getElementById("editor");
	CodeMirror.commands.autocomplete = function(cm) {
		var mode = cm.getOption('mode');

		if (mode == 'htmlmixed') {
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
		mode : "text/html",
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
	CodeMirror.commands["selectAll"](myCodeMirror);
	
	function getSelectedRange() {
		return {
			from : myCodeMirror.getCursor(true),
			to : myCodeMirror.getCursor(false)
		};
	}
	
	function autoFormatSelection() {
		var range = getSelectedRange();
		myCodeMirror.autoFormatRange(range.from, range.to);
	}
	
	function commentSelection(isComment) {
		var range = getSelectedRange();
		myCodeMirror.commentRange(isComment, range.from, range.to);
	}
	
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
	$("a[data-action=editor-share-code]").click(function() {
		$("#dialog").attr('title', 'Share via this link');
		var dialogContent = "<table style='width:100%'><tr><td>" + document.location.origin + docName + "</td><tr><td><input id='collaboratorEmail' style='width:100%; margin:5px 0px 5px 0px' type='email' placeholder='Enter a valid email address'></input></td></tr><tr><td align='center'><button role='button' id='shareDocOrig' style='margin:5px 0px 5px 0px' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'><span class='ui-button-text'>Share</span></button></td></tr></table>";
		$("#dialog").html(dialogContent);
		$("#dialog").dialog({
			show : "blind",
			hide : "explode",
			position : "top",
			modal : true
		});
	});
	
	$("a[data-action=editor-comment-selected]").click(function(){
		commentSelection(true);
	});
	
	$("a[data-action=editor-uncomment-selected]").click(function(){
		commentSelection(false);
	});
	
	$("a[data-action=editor-format-selected-code]").click(function(){
		autoFormatSelection();
	});

  $("a[data-action=editor-console]").click(function(){
    if($(this).attr('href') === '#show' ){
      $("#small-console").css({ bottom: 180});
      $(this).attr('href', '#hide');
      $("#small-console a i").attr('class', 'icon-chevron-down icon-white pull-right');
      _div = $("<div>");
      _div.css({display: 'block', position: 'relative', height: 180, top: 20,
               'overflow-y': 'auto',
                '-webkit-transition': 'all .5s ease',
                margin: '0 15px 0 15px',
               'background': '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#666666), to(#666666), color-stop(.6,#333))', 
               opacity: 0.8});
      $("#small-console").append(_div);
      $(_div).toggleClass("small-console-animated");
      $("#small-console").toggleClass("small-console-animated");
    } else {
      $("#small-console").css({ bottom: 0});
      $(this).attr('href', '#show');
      $("#small-console div").remove();
      $("#small-console a i").attr('class', 'icon-chevron-up icon-white pull-right');
    }
  });
});
