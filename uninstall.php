<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'jug_ai_auth_token' );
delete_option( 'jug_ai_user_id' );
delete_option( 'jug_ai_settings' );
