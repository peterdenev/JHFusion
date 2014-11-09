var JHF = new JHFusion();

//var validateVar = 

var varsHub = {
	synch_var: 'aa',
	msg: '',	
	init_copy: function(scope, target){
		console.log('something');
		target.val(scope.synch_var)
	},
	showAlert: function(scope, target){
		console.log('in');
		target.val('Info message: '+scope.msg);
	},
	validateVar: function(el){		
		if(varsHub.str2validate.length>5){			
			varsHub.errText = 'More then 5 chars!'
			varsHub.validClass = 'error';
		}else{
			varsHub.errText = '';
			varsHub.validClass = 'ok';
		}
	}
};

JHF.complex(varsHub,'alertMSG',['msg'],function(){		
	return 'Info message: '+varsHub.msg
})

JHF.complex(varsHub,null,['msg'],function(){		
	console.log('msg was changed');
})


JHF.bindOne( varsHub, $('#input_el_1') );
JHF.bindOne( varsHub, $('#input_el_2') );
JHF.bindOne( varsHub, $('#input_el_3') );
JHF.bindOne( varsHub, $('#input_el_4') );
JHF.bindOne( varsHub, $('#input_el_5') );

JHF.bindOne( varsHub, $('#input_el_6') );
JHF.bindOne( varsHub, $('#alertBox') );
JHF.bindOne( varsHub, $('#alertBox2') );

JHF.bindOne( varsHub, $('#alertBox_auto') );

JHF.bindOne( varsHub, $('#input_el_11') );
JHF.bindOne( varsHub, $('#input_el_12') );

JHF.bindOne( varsHub, $('#input_el_13') );


JHF.fill({
 	scope: varsHub, 
 	el: $('#autoGenerate_binding'),
 	models: 'val <<> synch_var'
})



//-----

JHF.controller('MailboxController',function(scope){
	
	scope={
		"name": "Alice",
  		"unread": 7,
  		"total": 10, 	
  		/*_complex: {
  			'mixed':[
  				['name','last'], function(){					
					return scope.name+" "+scope.last;			
				}
  			]
  		} */		
	}


	JHF.complex(scope,'greet',['name'],function(){		
		return 'Hi, '+scope.name;			
	})

	JHF.complex(scope,'progStyle',['total','unread'],function(){		
		return 'width: '+(100 * scope.unread / scope.total)+'%;'		
	})

	window.mailboxScope=function(){
		return scope;
	}

	return scope;
})

