<?php
/*
Plugin Name: WPCB Right Sidebar plugin 
Plugin URI:  http://positivesum.ca/
Description: WP plugin to Add CB right column
Version: 0.1
Author: Alexander Yachmenev
Author URI: http://www.odesk.com/users/~~94ca72c849152a57
*/
if ( !class_exists( 'wp_cb_rightsidebar' ) ) {
	class wp_cb_rightsidebar {
		public $html;		
		/**
		 * Initializes plugin variables and sets up wordpress hooks/actions.
		 *
		 * @return void
		 */
		function __construct( ) {
			$this->pluginDir		= basename(dirname(__FILE__));
			$this->pluginPath		= WP_PLUGIN_DIR . '/' . $this->pluginDir;
			$this->pluginUrl 		= WP_PLUGIN_URL.'/'.$this->pluginDir;	

			add_action('init', array(&$this, 'wp_cb_rightsidebar_init'));
			add_action('admin_init', array(&$this, 'wp_cb_rightsidebar_admin_init'));
		}

		function wp_cb_rightsidebar_init() {
			//add_action('cfct_build_pre_build',  array(&$this, 'wp_cb_rightsidebar_pre_build'));
			//add_action('cfct_build_post_build',  array(&$this, 'wp_cb_rightsidebar_post_build'));
			
			add_action('template_redirect', array(&$this, 'wp_cb_rightsidebar_template_redirect'));
			//add_action('wp_ajax_nopriv_wp_cb_rightsidebar',  array(&$this, 'wp_cb_rightsidebar_ajax'));
		}		

		function wp_cb_rightsidebar_template_redirect() {
			
			if(is_admin()) return;

			global $post, $cfct_build;
			
			$cfct_build->template->set_is_admin(false);					
			$cfct_build->_init(intval($post->ID));
			$template = $cfct_build->template->get_template();
			$rows = $template['rows'];
			$is_sidebar = false;
			$sidebar_rows = array();
			$i = 0;
			foreach ($rows as $key => $row) {
				if (isset($row['sidebar'])) {
					$sidebar_rows['s'.$i] = $key;
					$i++;
					$is_sidebar = true;
				}
			}

			if (!empty($sidebar_rows)) {
				wp_enqueue_script('wp-cb-rightsidebar', $this->pluginUrl . '/js/wp-cb-rightsidebar-front.js', array('jquery'), '1.0'); // 
				wp_localize_script('wp-cb-rightsidebar', 'SidebarsRows', $sidebar_rows);				
			}
		}
		
		function wp_cb_rightsidebar_admin_init() {
			wp_enqueue_style('wp-cb-rightsidebar', $this->pluginUrl . '/css/wp-cb-rightsidebar.css' );		
			wp_enqueue_script('wp-cb-rightsidebar', $this->pluginUrl . '/js/wp-cb-rightsidebar.js', array('jquery'), '1.0'); // 

			add_action('cfct_build_pre_build',  array(&$this, 'wp_cb_cfct_build_pre_build')); //
			
			add_action('cfct_admin_pre_build',  array(&$this, 'wp_cb_rightsidebar_pre_build'));
			add_action('cfct_admin_post_build',  array(&$this, 'wp_cb_rightsidebar_post_build'));
			add_action('wp_ajax_wp_cb_rightsidebar', array(&$this, "wp_cb_rightsidebar_ajax"));	
			
			
			
		}
		
		function wp_cb_rightsidebar_ajax() {
			global $cfct_build;
			$response = array();
			// Allowed actions: add, update, delete
			$action = isset( $_REQUEST['operation'] ) ? $_REQUEST['operation'] : 'get';
			switch ( $action ) {
				case 'get':	
				if (is_admin()) {
					$cfct_build->_init(intval($_REQUEST['post_id']),true);
					$template = $cfct_build->template->get_template();
					$rows = $template['rows'];
					foreach ($rows as $key => $row) {
						if (!isset($row['sidebar'])) {
							$cfct_build->template->remove_row($key);
						}
					}
					$result = $cfct_build->template->html($cfct_build->data);
				}				
				break;
				case 'get_front':
					$post_id = url_to_postid($_REQUEST['url']);	
					$cfct_build->template->set_is_admin(false);					
					$cfct_build->_init(intval($post_id));
					$template = $cfct_build->template->get_template();
					$rows = $template['rows'];
					foreach ($rows as $key => $row) {
						if (!isset($row['sidebar'])) {
							$cfct_build->template->remove_row($key);
						}
					}
					$result = $cfct_build->template->html($cfct_build->data);
				break;				
			}
			$response['result'] = $result;
			echo (json_encode($response));
			die();				
		}

		// Prevent any right column content from being added to post_content
		function wp_cb_cfct_build_pre_build($cfct_build) {
			$this->template = $cfct_build->template->get_template();
			$rows = $this->template['rows'];
			foreach ($rows as $key => $row) {
				if (isset($row['sidebar'])) {
					$cfct_build->template->remove_row($key);
				}
			}
		}			
		
		function wp_cb_rightsidebar_pre_build($cfct_build) {
			$this->template = $cfct_build->template->get_template();
			$rows = $this->template['rows'];
			foreach ($rows as $key => $row) {
				if (isset($row['sidebar'])) {
					$cfct_build->template->remove_row($key);
				}
			}
		}			

		function wp_cb_rightsidebar_post_build($cfct_build) {
			$cfct_build->template->set_template($this->template);
		}			
	}
	$wp_cb_rightsidebar = new wp_cb_rightsidebar();	
}
