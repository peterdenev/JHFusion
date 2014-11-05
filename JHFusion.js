(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js
    if(typeof define === 'function' && define.amd) {
        define('JHFusion',[], factory);
    }else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        // Browser globals
        root.JHFusion = factory();
    }
}(this, function () {

    var attr_pfx = 'data-';

    var last_bind_id = 0;

    var bindedElementsHandlers = {
        //'id': 'handelr'
    }

    function depObserve(scope, deps, renderHandler, handlerData, breakOnFirst){
        breakOnFirst = typeof breakOnFirst !== 'undefined' ? breakOnFirst : false; 
        var this_o_handler = function(changes){                           
            for(var ch_i in changes) { 
                if(deps.indexOf(changes[ch_i].name)!== -1){
                    renderHandler.apply(this, handlerData);
                    if(breakOnFirst)
                        break; // do only once per change
                }
            }
        }      
        Object.observe(scope, this_o_handler);
        return this_o_handler;
    }

    function defaultModelPatternHandler($html_el, model_pattern, callback){  
        var model_bindings = (model_pattern || '').split(',');  
        for(var b_i in model_bindings){
            var attr_var = model_bindings[b_i].trim().split(' ').map(function(el){
                return el.trim();
            }).filter(function(el){
                return el!='';
            });      
            if(attr_var.length==1){
                attr_var.push('<<>')
                attr_var.push(attr_var[0])
                attr_var[0] = 'val'
            }

            if(attr_var.length>2 && attr_var[2]!=''){
                var to_html_count = (attr_var[1].match(/</g) || []).length;
                var to_js_count = (attr_var[1].match(/>/g) || []).length;        
                var initCopyTo = (to_html_count==2) ? 'html' : (to_js_count==2) ? 'js' : null;
                callback(
                    (function($html_el,attr_var){
                        var reserved = ['val','html','text'];
                        return {
                            varName: attr_var[2],
                            canRead: to_html_count>0,
                            canWrite: to_js_count>0,
                            initCopyTo: initCopyTo,
                            valueFromHTML: function(){
                                if(reserved.indexOf(attr_var[0])!=-1){
                                    return $html_el[attr_var[0]]();
                                }                                
                                return $html_el.attr(attr_var[0]);
                            },
                            valueToHTML: function(value){
                                if(reserved.indexOf(attr_var[0])!=-1){
                                    return $html_el[attr_var[0]](value);
                                }else{
                                    $html_el.attr(attr_var[0],value);
                                }
                            }
                        }
                    })($html_el,attr_var) 
                )
            }
        }
   }

   function bindTrigers(scope, $html_el, this_bindedElementsHandlers){
        // JS change -> JS (function)
        var to_triger_now = false;
        var triggers = ($html_el.attr(attr_pfx+'trigers') || '').split(',').map(function(el){
            return el.trim();
        }).filter(function(el){
            if(el=='!'){
                to_triger_now = true
                return false;  
            }
            return true;
        }) 
        //var handler = scope[$html_el.attr(attr_pfx+'handler')];
        var handler = getScopedValue(scope,$html_el.attr(attr_pfx+'handler') || '')
        if(handler){//loaders...
            var this_o_handler = depObserve( scope, triggers , handler, [scope,$html_el] );    
            this_bindedElementsHandlers.jsChangeHandler = this_o_handler;          
            if(to_triger_now) handler(scope, $html_el);//init load
        }   
   }

   function bindOns(scope, $html_el, this_bindedElementsHandlers){
        $html_el.each(function() {
            $.each(this.attributes, function() {                   
                if(this.specified) {                                  
                    if(this.name.indexOf(attr_pfx+"on")==0){
                        var on_func_parts = this.value.split('(');                           
                        var onFnArgs = [];
                        if(on_func_parts.length>1){
                            onFnArgs = on_func_parts[1].split(')')[0].trim().split(',').map(function(el){
                                return el.trim();
                            });
                        } 
                        var on_type = this.name.substr((attr_pfx+"on").length)
                        if(!this_bindedElementsHandlers.ons.hasOwnProperty(on_type)){
                            this_bindedElementsHandlers.ons[on_type] = []
                        }
                        var this_on_handler = function(){
                            getScopedValue(scope, on_func_parts[0].trim()).apply(this, onFnArgs)
                        }
                        this_bindedElementsHandlers.ons[on_type].push(this_on_handler)                   
                        $html_el.on(on_type, this_on_handler)                          
                    }                       
                }
            });
        }); 
   }

    function bindOne(scope, $html_el, overwrite, modelPatternHandler){  
        modelPatternHandler = typeof modelPatternHandler !=='undefined' ? modelPatternHandler : defaultModelPatternHandler;   
        var this_bind_id = $html_el.attr(attr_pfx+'bind-id');
        if(typeof this_bind_id == 'undefined' || overwrite){
            if(typeof this_bind_id == 'undefined'){
                this_bind_id = last_bind_id++;
                $html_el.attr(attr_pfx+'bind-id',this_bind_id)
            }
            if(overwrite && bindedElementsHandlers.hasOwnProperty(this_bind_id)){
                //remove handlers from browser
                for(var o_i in bindedElementsHandlers[this_bind_id].observeHandlers){
                    var obs_h = bindedElementsHandlers[this_bind_id].observeHandlers[o_i];                   
                    Object.unobserve(scope, obs_h);
                }
                for(var o_type in bindedElementsHandlers[this_bind_id].ons){
                   $html_el.off(o_type);
                }
                if(bindedElementsHandlers[this_bind_id].jsChangeHandler){                    
                    Object.unobserve(scope, bindedElementsHandlers[this_bind_id].jsChangeHandler);                          
                }
            }        
            bindedElementsHandlers[this_bind_id] = {
                ref_el: $html_el,                
                observeHandlers: [],                
                ons: {
                    change:[]
                },
                jsChangeHandler : undefined                 
            }        
       
            modelPatternHandler($html_el, $html_el.attr(attr_pfx+'models'), function(this_mb_handeler){

                var this_onchange_handler = function(){
                    setScopedValue(
                        this_mb_handeler.varName,
                        this_mb_handeler.valueFromHTML(),
                        scope
                    ) 
                } 

                //init copy
                switch(this_mb_handeler.initCopyTo){
                    case 'js': this_onchange_handler(); break;
                    case 'html': this_mb_handeler.valueToHTML(
                        getScopedValue(scope,this_mb_handeler.varName)); break;
                }            
           
                //js change -> html (if not -> only read from html) 
                if(this_mb_handeler.canRead){
                    var this_observe_hanlder =  function(changes){  //<< this in bind handelrs hub
                        for(var ch_i in changes) {
                            if(changes[ch_i].name==this_mb_handeler.varName){
                                this_mb_handeler.valueToHTML(getScopedValue(scope,this_mb_handeler.varName));
                            }
                        }                    
                    }                        
                    bindedElementsHandlers[this_bind_id].observeHandlers.push(this_observe_hanlder)
                    Object.observe(scope, this_observe_hanlder);
                }

                //html change -> js   (if not -> only read from js)                
                if(this_mb_handeler.canWrite){
                    bindedElementsHandlers[this_bind_id].ons.change.push(this_onchange_handler)
                    $html_el.on('change',this_onchange_handler); 
                }                 
            })
            // JS change -> JS (function)
            bindTrigers(scope, $html_el, bindedElementsHandlers[this_bind_id])

            //onclick
            bindOns(scope, $html_el, bindedElementsHandlers[this_bind_id])         
        }
        return this_bind_id;         
    }

    function arrTrim(arr){
        return arr.map(function(el){
            return el.trim();
        })
    }

    function filterEmpty(arr){
        return arr.filter(function(el){
            return el!=''
        })
    }

    //nested 
    function bindHtml(scope, topHtmlEl, overwrite, modelPatternHandler){        
        overwrite = typeof overwrite !=='undefined' ? overwrite : true;        
        topHtmlEl = typeof topHtmlEl !=='undefined' ? topHtmlEl : $('body'); 
        var bind_ids = [];       
        $(topHtmlEl).find('['+attr_pfx+'models]').each(function(){            
            bind_ids.push(bindOne(scope, $(this), overwrite, modelPatternHandler))   
        });
        return bind_ids;
    }

    function fill(args){      
        $(args.el).attr(attr_pfx+'models',args.models);
        $(args.el).attr(attr_pfx+'trigers',args.trigers);
        $(args.el).attr(attr_pfx+'handler',args.handler);
        // bind this ell
        return bindOne(args.scope, args.el);
    }

    function functionName(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret.trim();
    }

    function controllers(controllerFuncs){
        for(var c_i in controllerFuncs){
            var controllerFunc = controllerFuncs[c_i];
            var contr_name = functionName(controllerFunc);
            controller(contr_name, controllerFunc)
        }        
    }

    function controller(controller_name, contr_func){
        var topEl = $('['+attr_pfx+'controller="'+controller_name+'"]');
        if(topEl.length){            
            var scope = contr_func({});
            bindHtml(scope,topEl);
        }
    }

    function clearHandlers(list_ids){
        if(['number','string'].indexOf(list_ids) != -1){
            list_ids = [list_ids]
        }    
        if(typeof list_ids == 'object'){            
            for(var l_i in list_ids){
                delete bindedElementsHandlers[list_ids[l_i]]
            }
        }   
    }

    // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
    function getScopedValue(scope, inner_path) {
        inner_path = inner_path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        inner_path = inner_path.replace(/^\./, '');           // strip a leading dot
        var a = inner_path.split('.');
        while (a.length) {
            var n = a.shift();
            if (n in scope) {
                scope = scope[n];
            } else {
                return;
            }
        }
        return scope;
    }

    //http://stackoverflow.com/questions/2061325/javascript-object-key-value-coding-dynamically-setting-a-nested-value
    function setScopedValue(key,val,obj) {
        if (!obj) obj = data; //outside (non-recursive) call, use "data" as our base object
        var ka = key.split(/\./); //split the key by the dots
        if (ka.length < 2) { 
            obj[ka[0]] = val; //only one part (no dots) in key, just set value
        } else {
            if (!obj[ka[0]]) obj[ka[0]] = {}; //create our "new" base obj if it doesn't exist
            obj = obj[ka.shift()]; //remove the new "base" obj from string array, and hold actual object for recursive call
            setScopedValue(ka.join("."),val,obj); //join the remaining parts back up with dots, and recursively set data on our new "base" obj
        } 
    }

    return {
        attr_pfx: attr_pfx,
        bindHtml: bindHtml,
        controllers: controllers,
        controller : controller,
        fill: fill,
        bindedElementsHandlers: bindedElementsHandlers,  
        bindOne: bindOne,  
        clearHandlers: clearHandlers,    
    }

}));