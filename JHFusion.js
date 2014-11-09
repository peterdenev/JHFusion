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

    var jhfInstancesCount = 0;

    function JHFusion(arg_options){

        var instance_pfx = jhfInstancesCount++;             

        var cfg = {
            attr_pfx: 'data-',
            instance_pfx : instance_pfx,
            observeHandler: Object.observe || function(){},
            unobserveHandler: Object.unobserve || function(){},      
            //mappingHandler: mappingHandler     
        }

        cfg.mappingHandler = function($html_el, model_pattern, callback){  
            //  (([a-zA-Z, 0-9_-]+):)?(([a-zA-Z0-9_-]+)?([<> ]+){1})?([a-zA-Z, 0-9_-]+){1}
            var model_bindings = (model_pattern || '').split(';');  
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
                    var html_ons_attr = attr_var[0].split(':').map(function(el){
                        return el.trim();
                    });
                    if(html_ons_attr.length==1){
                        html_ons_attr.push(html_ons_attr[0])
                        html_ons_attr[0] = 'change'
                    }
                    var ons = html_ons_attr[0].split(',').map(function(el){
                        return el.trim();
                    });                    

                    var to_html_count = (attr_var[1].match(/</g) || []).length;
                    var to_js_count = (attr_var[1].match(/>/g) || []).length;        
                    var initCopyTo = (to_html_count==2) ? 'html' : (to_js_count==2) ? 'js' : null;

                    callback(
                        (function($html_el,attr_var,html_ons_attr){
                            var reserved = ['val','html','text'];
                            return {
                                varName: attr_var[2],
                                canRead: to_html_count>0,
                                canWrite: to_js_count>0,
                                initCopyTo: initCopyTo,
                                ons: ons,
                                valueFromHTML: function(){
                                    if(reserved.indexOf(html_ons_attr[1])!=-1){
                                        return $html_el[html_ons_attr[1]]();
                                    }                                
                                    return $html_el.attr(html_ons_attr[1]);
                                },
                                valueToHTML: function(value){
                                    if(reserved.indexOf(html_ons_attr[1])!=-1){
                                        return $html_el[html_ons_attr[1]](value);
                                    }else{
                                        $html_el.attr(html_ons_attr[1],value);
                                    }
                                }
                            }
                        })($html_el,attr_var,html_ons_attr) 
                    )
                }
            }
        }
        //merge with user options
        $.extend(cfg, arg_options);     
    
        var last_bind_id = 0;

        var bindedElementsHandlers = {
            complex: [],
            //'id': 'handelr'
        }

        var is_controller = false;
    
        var initFuncs = [];        

        this.getOptions = function(){
            return cfg;
        }              

       var bindTriggerOns = function(scope, $html_el, this_bindedElementsHandlers){
            $html_el.each(function() {
                $.each(this.attributes, function() {                   
                    if(this.specified) {                                  
                        if(this.name.indexOf(cfg.attr_pfx+"on")==0){
                            var on_func_parts = this.value.split('(');                           
                            var onFnArgs = [];
                            if(on_func_parts.length>1){
                                onFnArgs = on_func_parts[1].split(')')[0].trim().split(',').map(function(el){
                                    el = el.trim();                                    
                                    return el=='this' ? $html_el : el;
                                });
                            } 
                            var on_type = this.name.substr((cfg.attr_pfx+"on").length)
                            if(!this_bindedElementsHandlers.ons.hasOwnProperty(on_type)){
                                this_bindedElementsHandlers.ons[on_type] = []
                            }
                            var this_on_handler = function(){
                                var that = {scope:scope, on:this.name}
                                getScopedValue(scope, on_func_parts[0].trim()).apply(that, onFnArgs)
                            }
                            this_bindedElementsHandlers.ons[on_type].push(this_on_handler)                   
                            $html_el.on(on_type, this_on_handler)                          
                        }                       
                    }
                });
            }); 
        }

        this.bindOne = function(scope, $html_el, overwrite){ 
            var this_bind_id = $html_el.attr(cfg.attr_pfx+'bind-id');
            if(typeof this_bind_id == 'undefined' || overwrite){
                if(typeof this_bind_id == 'undefined'){
                    this_bind_id = cfg.instance_pfx+"_"+last_bind_id++;
                    $html_el.attr(cfg.attr_pfx+'bind-id',this_bind_id)
                }
                if(overwrite && bindedElementsHandlers.hasOwnProperty(this_bind_id)){
                    //remove handlers from browser
                    this.clearHandlers(this_bind_id);
                }        
                bindedElementsHandlers[this_bind_id] = {
                    scope: scope,
                    ref_el: $html_el,                
                    observeHandlers: [],                
                    ons: {
                        change:[]
                    },                                   
                }        
           
                cfg.mappingHandler($html_el, $html_el.attr(cfg.attr_pfx+'map'), function(this_mb_handeler){

                    var this_onchange_handler = function(){
                        setScopedValue(
                            this_mb_handeler.varName,
                            this_mb_handeler.valueFromHTML(),
                            scope
                        ) 
                    } 

                    var setToHTML = function(scopedVar){
                        if(typeof scopedVar == 'function'){
                            scopedVar = scopedVar.apply(this,[])
                        }
                        this_mb_handeler.valueToHTML(scopedVar);
                    }                           

                    //init copy
                    switch(this_mb_handeler.initCopyTo){
                        case 'js': this_onchange_handler(); break;
                        case 'html': setToHTML(getScopedValue(scope,this_mb_handeler.varName)); break;
                    }            
               
                    //js change -> html (if not -> only read from html) 
                    if(this_mb_handeler.canRead){
                        var this_observe_hanlder =  function(changes){  //<< this in bind handelrs hub
                            for(var ch_i in changes) {
                                if(changes[ch_i].name==this_mb_handeler.varName){
                                    setToHTML(getScopedValue(scope,this_mb_handeler.varName));
                                }
                            }                    
                        }                        
                        bindedElementsHandlers[this_bind_id].observeHandlers.push(this_observe_hanlder)
                        cfg.observeHandler(scope, this_observe_hanlder);
                    }

                    //html change -> js   (if not -> only read from js)                
                    if(this_mb_handeler.canWrite){                       
                        for(var on_i in this_mb_handeler.ons){
                            var this_on = this_mb_handeler.ons[on_i];
                            if(!bindedElementsHandlers[this_bind_id].ons.hasOwnProperty(this_on)){
                                bindedElementsHandlers[this_bind_id].ons[this_on] = [];
                            }
                            bindedElementsHandlers[this_bind_id].ons[this_on].push(this_onchange_handler)
                            $html_el.on(this_on,this_onchange_handler);
                        } 
                    }                 
                })              

                //onclick
                bindTriggerOns(scope, $html_el, bindedElementsHandlers[this_bind_id])         
            }
            return this_bind_id;         
        }

       /* var arrTrim = function(arr){
            return arr.map(function(el){
                return el.trim();
            })
        }

        var filterEmpty = function(arr){
            return arr.filter(function(el){
                return el!=''
            })
        }*/

        //nested 
        this.bindHtml = function(scope, topHtmlEl, overwrite){        
            overwrite = typeof overwrite !=='undefined' ? overwrite : true;        
            topHtmlEl = typeof topHtmlEl !=='undefined' ? topHtmlEl : $('body'); 
            var bind_ids = [];   
            var that = this;    
            $(topHtmlEl).find('['+cfg.attr_pfx+'map]').each(function(){            
                bind_ids.push(that.bindOne(scope, $(this), overwrite))   
            });
            return bind_ids;
        }

        this.complex = function(scope, targetVar, deps, renderHandler, handlerData, breakOnFirst){
            breakOnFirst = typeof breakOnFirst !== 'undefined' ? breakOnFirst : false; 
            var setVar = function(){ /*scope,handlerData,targetVar*/
                var rez = renderHandler.apply(scope, handlerData)
                if(targetVar) setScopedValue(targetVar,rez,scope)                
            }
            var this_o_handler = function(changes){                           
                for(var ch_i in changes) { 
                    if(deps.indexOf(changes[ch_i].name)!== -1){
                        setVar()                      
                        if(breakOnFirst)
                            break; // do only once per change
                    }
                }
            }
            //save handler ref            
            bindedElementsHandlers.complex.push({
                scope: scope,
                varName: targetVar,
                deps: deps,
                handler: this_o_handler
            })

            cfg.observeHandler(scope, this_o_handler);
            if(deps.indexOf('!')!=-1){
                if(is_controller){                    
                    initFuncs.push({ handler: setVar, args: []});
                }else{
                    setVar();
                }
            } 
            //return setVar; 
        }
        

        this.fill = function(args){      
            $(args.el).attr(cfg.attr_pfx+'map',args.map);           
            // bind this ell
            return this.bindOne(args.scope, args.el);
        }

        var functionName = function(fun) {
            var ret = fun.toString();
            ret = ret.substr('function '.length);
            ret = ret.substr(0, ret.indexOf('('));
            return ret.trim();
        }

        this.controllers = function(controllerFuncs){
            for(var c_i in controllerFuncs){
                var controllerFunc = controllerFuncs[c_i];
                var contr_name = functionName(controllerFunc);
                this.controller(contr_name, controllerFunc)
            }        
        }

        this.controller = function(controller_name, contr_func){       
            var topEl = $('['+cfg.attr_pfx+'controller="'+controller_name+'"]');
            
            if(topEl.length){
                is_controller = true;                               
                var scope = contr_func({});
                if(scope.hasOwnProperty('_complex')){
                    for(var varName in scope._complex){
                        var this_complex = scope._complex[varName];
                        this.complex(scope, varName, this_complex[0], this_complex[1], this_complex[2], this_complex[3])
                    }
                }                
                var binded_ids = this.bindHtml(scope,topEl);
                for(var i in initFuncs){
                    initFuncs[i].handler.apply(null,initFuncs[i].args);
                }
                is_controller = false;
                if(scope.hasOwnProperty('init')){
                    scope.init.apply(scope,[binded_ids])
                }            
            }
        }

        this.clearHandlers = function(list_ids){
            if(['number','string'].indexOf(list_ids) != -1){
                list_ids = [list_ids]
            }    
            if(typeof list_ids == 'object'){            
                for(var l_i in list_ids){
                    var this_bind_id = list_ids[l_i];
                    //remove handlers from browser
                    var scope = bindedElementsHandlers[this_bind_id].scope;
                    var $html_el = bindedElementsHandlers[this_bind_id].ref_el;
                    for(var o_i in bindedElementsHandlers[this_bind_id].observeHandlers){
                        var obs_h = bindedElementsHandlers[this_bind_id].observeHandlers[o_i];                   
                        cfg.unobserveHandler(scope, obs_h);
                    }
                    for(var o_type in bindedElementsHandlers[this_bind_id].ons){
                       $html_el.off(o_type);
                    }                    
                    delete bindedElementsHandlers[this_bind_id]
                }
                /*for(var c_i in bindedElementsHandlers.complex){   
                    var this_complex = bindedElementsHandlers.complex[c_i];
                    cfg.unobserveHandler(this_complex.scope, this_complex.handler);                          
                }*/
            }   
        }

        // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        var getScopedValue = function(scope, inner_path) {
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
        var setScopedValue = function(key,val,obj) {
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

    }

    return JHFusion

}));