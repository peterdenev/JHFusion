var JHF = new JHFusion();

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
	}
};

JHF.bindOne( varsHub, $('#input_el_1') );
JHF.bindOne( varsHub, $('#input_el_2') );
JHF.bindOne( varsHub, $('#input_el_3') );
JHF.bindOne( varsHub, $('#input_el_4') );
JHF.bindOne( varsHub, $('#input_el_5') );

JHF.bindOne( varsHub, $('#input_el_6') );
JHF.bindOne( varsHub, $('#alertBox') );

JHF.bindOne( varsHub, $('#alertBox_auto') );

JHF.bindOne( varsHub, $('#input_el_11') );
JHF.bindOne( varsHub, $('#input_el_12') );


JHF.fill({
 	scope: varsHub, 
 	el: $('#autoGenerate_binding'),
 	models: 'val <<> synch_var'
})
