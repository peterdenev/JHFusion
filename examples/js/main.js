var JHF = new JHFusion();

function init(){
	//debugger;
	var scope ={};

    scope.todos = ['one', 'two','three']

	scope.listTodos = function(scope, target){
        JHF.clearHandlers(scope.tasks_ids);		
        $(target).html(TemplateEngine(document.querySelector('#tmpl_1').innerHTML,scope.todos))   
        scope.tasks_ids = JHF.bindHtml(scope, target);
    }

    scope.delEl = function(el_id){       
        scope.todos = scope.todos.filter(function(el,i){
            return i!=el_id
        })
    }	

    scope.addItem = function(){
        scope.todos = scope.todos.concat(scope.new_todo_text);
    }

    window.vars = function(){
        return scope;
    }

    JHF.bindOne(scope,$('#new_task_in'));
    JHF.bindOne(scope,$('#todo_ul'));
    JHF.bindOne(scope,$('#add_task_btn'));

}


init();
