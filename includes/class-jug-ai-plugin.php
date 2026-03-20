<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Plugin {

	private static $instance = null;

	public $admin;
	public $rest_proxy;
	public $widget_inject;

	private function __construct() {
		$this->admin         = new Jug_AI_Admin();
		$this->rest_proxy    = new Jug_AI_Rest_Proxy();
		$this->widget_inject = new Jug_AI_Widget_Inject();

		register_activation_hook( JUG_AI_PLUGIN_DIR . 'jug-ai.php', array( $this, 'activate' ) );
		register_deactivation_hook( JUG_AI_PLUGIN_DIR . 'jug-ai.php', array( $this, 'deactivate' ) );
	}

	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function activate() {
		$defaults = Jug_AI_Settings::get_settings();
		if ( empty( get_option( 'jug_ai_settings' ) ) ) {
			update_option( 'jug_ai_settings', $defaults );
		}
	}

	public function deactivate() {
		// Optional: leave settings intact so re-activation preserves config.
	}

	public function __clone() {
		_doing_it_wrong( __FUNCTION__, 'Cloning is forbidden.', '1.0.0' );
	}

	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, 'Unserializing is forbidden.', '1.0.0' );
	}
}
