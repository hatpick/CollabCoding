(function () {
  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }
  
  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }

  function scriptHint(editor, keywords, getToken) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;

    // If it's not a 'word-style' token, ignore the token.
		//if (!/^[\w$_]*$/.test(token.string)) {
      //token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
                       //className: token.string == "." ? "property" : null};
    //}
    // If it is a property, find out what it is a property of.
    //while (tprop.className == "property") {
      //tprop = getToken(editor, {line: cur.line, ch: tprop.start});
      //if (tprop.string != ".") return;
      //tprop = getToken(editor, {line: cur.line, ch: tprop.start});
      //if (tprop.string == ')') {
        //var level = 1;
        //do {
          //tprop = getToken(editor, {line: cur.line, ch: tprop.start});
          //switch (tprop.string) {
          //case ')': level++; break;
          //case '(': level--; break;
          //default: break;
          //}
        //} while (level > 0)
        //tprop = getToken(editor, {line: cur.line, ch: tprop.start});
				//if (tprop.className == 'variable')
					//tprop.className = 'function';
				//else return; // no clue
      //}
      if (!context) var context = [];
      context.push(tprop);
    //}
    if (/^<.*/.test(token.string)) {
      token.start = token.start + 1;
    }
    return {list: getCompletions(token, context, keywords),
            from: {line: cur.line, ch: token.start},
            to: {line: cur.line, ch: token.end}};
  }

  CodeMirror.htmlHint = function(editor) {
    return scriptHint(editor, htmlKeywords,
                      function (e, cur) {return e.getTokenAt(cur);});
  };

  function getCoffeeScriptToken(editor, cur) {
  // This getToken, it is for coffeescript, imitates the behavior of
  // getTokenAt method in javascript.js, that is, returning "property"
  // type and treat "." as indepenent token.
    var token = editor.getTokenAt(cur);
    if (cur.ch == token.start + 1 && token.string.charAt(0) == '.') {
      token.end = token.start;
      token.string = '.';
      token.className = "property";
    }
    else if (/^\.[\w$_]*$/.test(token.string)) {
      token.className = "property";
      token.start++;
      token.string = token.string.replace(/\./, '');
    }
    return token;
  }

  //CodeMirror.coffeescriptHint = function(editor) {
    //return scriptHint(editor, coffeescriptKeywords, getCoffeeScriptToken);
  //}

  var htmlKeywords = ("!-- !DOCTYPE a abbr acronym address applet area article aside audio b base " + 
                       "basefont bdi bdo big blockquote body br button canvas caption center cite " + 
                       "code col colgroup command datalist dd del details dfn dir div dl dt em embed " + 
                       "fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header " + 
                       "hgroup hr html i iframe img input ins keygen kbd label legend li link map mark " +
                       "menu meta meter nav noframes noscript object ol optgroup option output p param pre " +
                       "progress q rp rt ruby s samp script section select small source span strike strong " +
                       "style sub summary sup table tbody td textarea tfoot th thead time title tr track tt " +
                       "u ul var video wbr").split(" ");

  function getCompletions(token, context, keywords) {
    var found = [], start = token.string.replace('<', '');
    function maybeAdd(str) {
      if (str.indexOf(start) === 0 && !arrayContains(found, str)) found.push(str);
    }
    function gatherCompletions(obj) {
      if (typeof obj == "string") forEach(stringProps, maybeAdd);
      else if (obj instanceof Array) forEach(arrayProps, maybeAdd);
      else if (obj instanceof Function) forEach(funcProps, maybeAdd);
      for (var name in obj) maybeAdd(name);
    }

    //if (context) {
      // If this is a property, see if it belongs to some object we can
      // find in the current environment.
      //var obj = context.pop(), base;
      //if (obj.className == "variable")
        //base = window[obj.string];
      //else if (obj.className == "string")
        //base = "";
      //else if (obj.className == "atom")
        //base = 1;
      //else if (obj.className == "function") {
        //if (window.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') &&
            //(typeof window.jQuery == 'function'))
          //base = window.jQuery();
        //else if (window._ != null && (obj.string == '_') && (typeof window._ == 'function'))
          //base = window._();
      //}
      //while (base != null && context.length)
        //base = base[context.pop().string];
      //if (base != null) gatherCompletions(base);
    //}
    //else {
      // If not, just look in the window object and any local scope
      // (reading into JS mode internals to get at the local variables)
      //for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
      //gatherCompletions(window);
      forEach(keywords, maybeAdd);
    //}

    return found;
  }
})();
