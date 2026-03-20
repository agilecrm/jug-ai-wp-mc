<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	public function add_menu_page() {
		add_menu_page(
			__( 'Jug.ai', 'jug-ai' ),
			__( 'Jug.ai', 'jug-ai' ),
			'manage_options',
			'jug-ai',
			array( $this, 'render_admin_page' ),
			'dashicons-format-chat',
			30
		);
	}

	public function render_admin_page() {
		echo '<div id="jug-ai-admin-root"></div>';
	}

	public function enqueue_scripts( $hook ) {
		if ( 'toplevel_page_jug-ai' !== $hook ) {
			return;
		}

		$asset_file = JUG_AI_PLUGIN_DIR . 'admin/build/index.asset.php';
		$deps       = array( 'wp-element' );
		$version    = JUG_AI_VERSION;

		if ( file_exists( $asset_file ) ) {
			$asset   = require $asset_file;
			$deps    = isset( $asset['dependencies'] ) ? $asset['dependencies'] : $deps;
			$version = isset( $asset['version'] ) ? $asset['version'] : $version;
		}

		wp_enqueue_script(
			'jug-ai-admin',
			JUG_AI_PLUGIN_URL . 'admin/build/index.js',
			$deps,
			$version,
			true
		);

		wp_enqueue_style(
			'jug-ai-admin-css',
			JUG_AI_PLUGIN_URL . 'admin/build/index.css',
			array(),
			$version
		);

		wp_localize_script( 'jug-ai-admin', 'jugAiConfig', array(
			'restUrl'    => esc_url_raw( rest_url( 'jug-ai/v1/' ) ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'siteUrl'    => esc_url( home_url() ),
			'siteName'   => get_bloginfo( 'name' ),
			'isLoggedIn' => Jug_AI_Settings::is_authenticated(),
			'settings'   => Jug_AI_Settings::get_settings(),
		) );
	}
}
