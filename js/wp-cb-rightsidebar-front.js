jQuery(function(){
	cfct_build = jQuery('.cfct-build');
	if (cfct_build.length > 0) {
		// Insert sidebar html elements	
		jQuery('.cfct-build:eq(0)').addClass('left-column');
		jQuery('.cfct-build:eq(0)').before('<div id="cfct-build-sidebar" class="cfct-build right-column"></div>');
		
		var row;
		jQuery.each(SidebarsRows, function(key, value) { 
			row = jQuery("#"+value).detach();
			row.appendTo(jQuery('#cfct-build-sidebar'));			
		});	
	}
});