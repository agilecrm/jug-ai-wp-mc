<?php
/**
 * Uninstall handler – removes all plugin data from the database.
 *
 * @package Jug_AI
 * @license GPL-2.0-or-later
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'jug_ai_auth_token' );
delete_option( 'jug_ai_user_id' );
delete_option( 'jug_ai_user_name' );
delete_option( 'jug_ai_user_email' );
delete_option( 'jug_ai_settings' );
