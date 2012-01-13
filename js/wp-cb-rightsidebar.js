function getRows(post_id) {
	jQuery.ajax({
	   type: "POST",
	   url: "/wp-admin/admin-ajax.php",
	   data: 'action=wp_cb_rightsidebar&operation=get' +
			 '&post_id=' + post_id,			 
       dataType: 'json',	   
	   success: function(data){
			if (data.result) {
				jQuery(data.result).appendTo(jQuery('#cfct-sortables-sidebar'));

				cfct_build = jQuery('#cfct-build');
				
				cfct_builder.bindClickables();

				jQuery('.cfct-row-delete',jQuery('#cfct-sortables-sidebar')).unbind().click(function() {
					var _this = jQuery(this);
					if (_this.parents('.cfct-row').find('div.cfct-module').length == 0) {
						cfct_builder.doRemoveRowSideBar(_this.parents('.cfct-row'));
					}
					else {
						cfct_builder.confirmRemoveRowSideBar(_this.parents('.cfct-row'));				
					}
					return false;
				});			
				
				
			}
	   },
		error: function(XMLHttpRequest, textStatus, errorThrown){
			alert(textStatus);		
		}	   
	 });			
}

function getQueryVariable(url, variable) {
	var query = url.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
		  return pair[1];
		}
	} 
	return false;
}

jQuery(function(){
	cfct_build = jQuery('#cfct-build');

	if (cfct_build.length > 0) {

		// cfct_builder methods 
		cfct_builder.updateRowOrder = function(event,ui) {
			var items = jQuery('#cfct-build-data').sortable('toArray');
			cfct_builder.fetch('reorder_rows',{
				order:items.toString()
			},'reorder-rows-response');
		};		
		
		// Add Row Functions
		cfct_builder.addRowSideBar = function() {
			this.toggleRowSideBarSelect();
		};

		cfct_builder.toggleRowSideBarSelect = function(dir) {
			var _chooser = jQuery('#cfct-select-new-sidebar-row');
			
			switch(true) {
				case _chooser.is(':visible'):
				case dir == 'hide':
					func = 'hide';
					break;
				case _chooser.is(':hidden'):
				case dir == 'show':
					cfct_builder.positionRowSelect(_chooser);
					func = 'show';
					break;
			}
					
			_chooser[func](); // Don't give this guy a speed unless you want to make a custom show/hide routine!
		};

		cfct_builder.insertRowSideBar = function(row_type) {
			this.toggleRowSideBarSelect('hide');
			if (!cfct_builder.opts.welcome_removed) {
				cfct_builder.hideWelcome();
			}
			
			return jQuery('#cfct-loading-row').slideDown('fast',function() {
				if (jQuery('#post_ID').val() < 0) {
					cfct_builder.initPost('insertRow',row_type);
					return false;
				}
				cfct_builder.fetch('new_row',{type:row_type, sidebar:true},'do-insert-row-sidebar');
				return true;
			});
		};
		
		// Remove Row Functions	
		cfct_builder.confirmRemoveRowSideBar = function(row) {
			jQuery('#cfct-delete-row-id',this.opts.dialogs.delete_row).val(row.attr('id'));
			
			// pop dialog
			this.opts.dialogs.popup_wrapper.html(this.opts.dialogs.delete_row);
			jQuery.openDOMWindow(this.opts.DOMWindow_defaults);

			// bind actions
			jQuery('#cfct-delete-row-confirm',this.opts.dialogs.delete_row).click(function() {
				cfct_builder.doRemoveRowSideBar( jQuery('#'+jQuery('#cfct-delete-row-id').val()) );
			});
			jQuery('#cfct-delete-row-cancel',this.opts.dialogs.delete_row).click(function() {
				jQuery.closeDOMWindow();
				return false;
			});
			jQuery(cfct_builder).trigger('confirm-remove-row');
		};

		cfct_builder.doRemoveRowSideBar = function(row) {		
			var _row = jQuery(row);
			cfct_builder.editing({
				'row_id':_row.attr('id')
			});
			cfct_builder.showPopupActivityDiv(cfct_builder.opts.dialogs.delete_row);
			
			var data = {
				row_id:_row.attr('id')
			};
			cfct_builder.fetch('delete_row',data,'do-remove-row-response-sidebar');
		};

		
		// cfct_builder bind events
		jQuery(cfct_builder).bind('do-insert-row-sidebar',function(evt,row) {
			if (!row.success) {
				cfct_builder.doError(row);
				return false;
			}
		
			jQuery('#cfct-loading-row').hide();
			jQuery('#cfct-sortables-sidebar',cfct_build).append(jQuery(row.html)).sortable('refresh');
			
			cfct_builder.bindClickables();

			jQuery('.cfct-row-delete',jQuery('#cfct-sortables-sidebar')).unbind().click(function() {
				var _this = jQuery(this);
				if (_this.parents('.cfct-row').find('div.cfct-module').length == 0) {
					cfct_builder.doRemoveRowSideBar(_this.parents('.cfct-row'));
				}
				else {
					cfct_builder.confirmRemoveRowSideBar(_this.parents('.cfct-row'));				
				}
				return false;
			});			

			
			jQuery('#cfct-build').removeClass('new');
			
			cfct_messenger.setMessage('Row Saved','confirm');
			jQuery(cfct_builder).trigger('new-row-inserted', row);
			return true;	
		});
		
		jQuery(cfct_builder).bind('do-remove-row-response-sidebar',function(evt,ret) {
			if (!ret.success) {
				cfct_builder.doError(ret);
				return false;
			}
			jQuery('#cfct-sortables-sidebar #' + cfct_builder.editing_items.row_id,cfct_build).slideUp('fast',function() {
				jQuery(this).remove();			
				jQuery.closeDOMWindow();
				cfct_builder.hidePopupActivityDiv(cfct_builder.opts.dialogs.delete_row);
				jQuery(cfct_builder).trigger('row-removed');
			});
			
			cfct_messenger.setMessage('Row Deleted','confirm');
			cfct_builder.editing(0);
			return true;
		});	


		// Insert sidebar html elements	
		jQuery('#cfct-sortables').css('width', '70%');
		jQuery('#cfct-sortables').before('<div class="meta-box-sortables ui-sortable" id="cfct-sortables-sidebar" style="width: 29%; float: right; margin: 0 5px;"></div>');
		jQuery('<a class="cfct-button cfct-button-dark" style="float:right;" id="cfct-sortables-sidebar-add" href="#cfct-select-new-sidebar-row">Add New Row to SideBar</a>').appendTo(jQuery('.cfct-rows-bottom-bar')[0]);

		var row_types = jQuery('#cfct-select-new-row ul').clone();
		jQuery('<div id="cfct-select-new-sidebar-row"><div class="cfct-popup-anchored cfct-popup-anchored-bottom"><div class="cfct-popup"><div class="cfct-popup-header"><h2 class="cfct-popup-title">Choose a Type of Row to Add into SideBar</h2></div><!-- /cfct-popup-header --><div class="cfct-popup-content"><ul class="cfct-il cfct-il-mini il-hover-titles cfct-clearfix cfct-rc-row-type-list"></ul></div><!-- /cfct-popup-content --></div><!--/cfct-popup--></div><!-- /cfct-popup-anchored --></div><!--/cfct-select-new-row-->').appendTo(jQuery('#cfct-sortables-add-container'));
		jQuery(row_types).appendTo(jQuery('#cfct-select-new-sidebar-row ul'));
		
		// init sortables sidebar bind events
		
		jQuery('#cfct-build-data').sortable({
			handle:cfct_builder.opts.row_handle,
			items:'.cfct-row',
			placeholder:'cfct-row-draggable-placeholder',
			forcePlaceholderSize:true,
			opacity:0.5,
			axis:'y',
			cancel:'.cfct-row-delete',
			update:cfct_builder.updateRowOrder
		});
		
		// init sortables sidebar
		jQuery('#cfct-sortables-sidebar').sortable({
			handle:cfct_builder.opts.row_handle,
			items:'.cfct-row',
			placeholder:'cfct-row-draggable-placeholder',
			forcePlaceholderSize:true,
			opacity:0.5,
			axis:'y',
			cancel:'.cfct-row-sidebar-delete',
			update:cfct_builder.updateRowOrder
		});

		// delete row buttons
		jQuery('.cfct-row-delete',jQuery('#cfct-sortables-sidebar')).unbind().click(function() {
			var _this = jQuery(this);
			if (_this.parents('.cfct-row').find('div.cfct-module').length == 0) {
				cfct_builder.doRemoveRowSideBar(_this.parents('.cfct-row'));
			}
			else {
				cfct_builder.confirmRemoveRow(_this.parents('.cfct-row'));				
			}
			return false;
		});	
		
		// add new row to sidebar
		jQuery('#cfct-sortables-sidebar-add',cfct_build).unbind().click(function() {	
			cfct_builder.addRowSideBar();
			return false;
		});

		// select row to insert
		jQuery('#cfct-select-new-sidebar-row ul').find('li > a').unbind().click(function() {
			cfct_builder.insertRowSideBar(jQuery(this).attr('rel'));
			return false;
		});

		//  // get rows
		
		var post_id = getQueryVariable(window.location, 'post');
		if (post_id) {
			getRows(post_id);
		}
		
	}
	
});