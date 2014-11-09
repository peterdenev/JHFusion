var JHF = new JHFusion();

JHF.controller('TodoController',function(scope){

    scope.todos = ['one', 'two','three']

	JHF.complex(scope, null, ['!','todos'],function(){
        var target = $('#todo_ul');
        JHF.clearHandlers(scope.tasks_ids);
        $(target).html(TemplateEngine(document.querySelector('#tmpl_1').innerHTML,scope.todos))   
        scope.tasks_ids = JHF.bindHtml(scope, target);
    })

    scope.delEl = function(el_id){             
        scope.todos = scope.todos.filter(function(el,i){
            return i!=el_id
        })
    }
	
    scope.addItem = function(){
        scope.todos = scope.todos.concat(scope.new_todo_text);
    }

    scope.down = function(){
        console.log('its down');
    }

    //debug
    window.vars = function(){
        return scope;
    }  

	return scope;
});
