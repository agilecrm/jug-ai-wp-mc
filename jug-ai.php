<?php
/**
 * Plugin Name: Jug.ai - AI Chatbot
 * Plugin URI:  https://jug.ai
 * Description: Add an AI chatbot trained on your website content. Powered by Jug.ai.
 * Version:     1.0.0
 * Author:      Jug.ai
 * Author URI:  https://jug.ai
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: jug-ai
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JUG_AI_VERSION', '1.0.0' );
define( 'JUG_AI_API_BASE', 'https://app.jug.ai/api' );
define( 'JUG_AI_WIDGET_BASE', 'https://app.jug.ai' );
define( 'JUG_AI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JUG_AI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-settings.php';
require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-api-client.php';
require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-rest-proxy.php';
require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-admin.php';
require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-widget-inject.php';
require_once JUG_AI_PLUGIN_DIR . 'includes/class-jug-ai-plugin.php';

function jug_ai_init() {
	return Jug_AI_Plugin::instance();
}

jug_ai_init();
