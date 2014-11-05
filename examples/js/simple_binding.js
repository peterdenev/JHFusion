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

JHFusion.bindOne( varsHub, $('#input_el_1') );
JHFusion.bindOne( varsHub, $('#input_el_2') );
JHFusion.bindOne( varsHub, $('#input_el_3') );
JHFusion.bindOne( varsHub, $('#input_el_4') );
JHFusion.bindOne( varsHub, $('#input_el_5') );

JHFusion.bindOne( varsHub, $('#input_el_6') );
JHFusion.bindOne( varsHub, $('#alertBox') );

JHFusion.bindOne( varsHub, $('#alertBox_auto') );

JHFusion.bindOne( varsHub, $('#input_el_11') );
JHFusion.bindOne( varsHub, $('#input_el_12') );


JHFusion.fill({
 	scope: varsHub, 
 	el: $('#autoGenerate_binding'),
 	models: 'val <<> synch_var'
})
