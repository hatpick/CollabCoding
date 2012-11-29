var Inlet = (function() {
    function inlet(ed) {
        var editor = ed;
        var slider;        
        var picker;
        
        var wrapper = editor.getWrapperElement();
        $(wrapper).on("mousedown", onClick);

        
        if($(".inlet_slider").size() === 0){
            var slider_node = document.createElement("div");
            slider_node.className = "inlet_slider";
            wrapper.parentNode.appendChild(slider_node);
            slider = $(slider_node);
            slider.slider({
                slide: function(event, ui) { 
                    
                    var cursor = editor.getCursor();
                    var token = editor.getTokenAt(cursor);
                    
                    var start = {"line":cursor.line, "ch":token.start};
                    var end = {"line":cursor.line, "ch":token.end};
                    editor.replaceRange(String(ui.value), start, end);
                }
            });
            slider.css('visibility', 'hidden');                
        } else {
            slider = $(".inlet_slider");
            slider.css('visibility', 'hidden');
        }
        
        if($("#colorPicker").size() !== 0) {            
            $("#colorPicker").remove();
             
        }        
        picker = new Color.Picker({
            id: "colorPicker",
            color: "#643263",
            display: false,
            size: 150,
            callback: function(rgba, state, type) {           
                var newcolor = Color.Space(rgba, "RGB>STRING");

                var cursor = editor.getCursor();
                var token = editor.getTokenAt(cursor);

                var start = {
                    "line" : cursor.line,
                    "ch" : token.start
                };
                var end = {
                    "line" : cursor.line,
                    "ch" : token.end
                };
                start.ch = start.ch + token.string.indexOf("#");
                end.ch = start.ch + 7;

                editor.replaceRange('#' + newcolor.toUpperCase(), start, end);
            }
        });
        
        
        function onClick(ev) {
            var cursor = editor.getCursor(true);
            var token = editor.getTokenAt(cursor);
            cursorOffset = editor.cursorCoords(true, "page");          
                        
            if(token.type === "number") {
                var value = parseFloat(token.string);
                var sliderRange;

                if (value === 0) { 
                    sliderRange = [-100, 100];
                } else {
                    sliderRange = [-value * 3, value * 5];
                }

                var slider_min = _.min(sliderRange);
                var slider_max = _.max(sliderRange);
                slider.slider('option', 'min', slider_min);
                slider.slider('option', 'max', slider_max);

                if ((slider_max - slider_min) > 20) {
                    slider.slider('option', 'step', 1);
                } else {
                    slider.slider('option', 'step', (slider_max - slider_min)/200);
                }
                slider.slider('option', 'value', value);

                var y_offset = 15;
                var sliderTop = cursorOffset.top - y_offset;
                var sliderLeft = cursorOffset.left - slider.width()/2;

                slider.offset({top: sliderTop - 10, left: sliderLeft});

                slider.css('visibility', 'visible');
                picker.element.style.display = "none";
            
            } else {                
                var match = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/);                
                if(match) {                    
                    var color = match[0];
                    color = color.slice(1, color.length);
                    picker.update(color);
                    
                    var top = cursorOffset.y + "px";
                    var left = cursorOffset.x + 100 + "px";
                    $("#ColorPicker").css('position', "absolute");
                    $("#ColorPicker").css('top', top);
                    $("#ColorPicker").css('left', left);                    
                    picker.toggle(true);
                } else {                    
                    picker.toggle(false);                                        
                }                
                slider.css('visibility', 'hidden');
            }
        }
    }
    return inlet;
})();
