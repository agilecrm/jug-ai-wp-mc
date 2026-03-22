<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Settings {

	const TOKEN_OPTION    = 'jug_ai_auth_token';
	const USER_ID_OPTION  = 'jug_ai_user_id';
	const USER_NAME_OPTION  = 'jug_ai_user_name';
	const USER_EMAIL_OPTION = 'jug_ai_user_email';
	const SETTINGS_OPTION = 'jug_ai_settings';
	const CIPHER_METHOD   = 'aes-256-cbc';

	private static function get_encryption_key() {
		return substr( hash( 'sha256', wp_salt( 'auth' ) ), 0, 32 );
	}

	private static function encrypt( $plaintext ) {
		$key    = self::get_encryption_key();
		$iv_len = openssl_cipher_iv_length( self::CIPHER_METHOD );
		$iv     = openssl_random_pseudo_bytes( $iv_len );
		$raw    = openssl_encrypt( $plaintext, self::CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv );

		if ( false === $raw ) {
			return false;
		}

		return base64_encode( $iv . $raw );
	}

	private static function decrypt( $ciphertext ) {
		$key    = self::get_encryption_key();
		$data   = base64_decode( $ciphertext );

		if ( false === $data ) {
			return false;
		}

		$iv_len = openssl_cipher_iv_length( self::CIPHER_METHOD );
		$iv     = substr( $data, 0, $iv_len );
		$raw    = substr( $data, $iv_len );

		$result = openssl_decrypt( $raw, self::CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv );

		return false === $result ? null : $result;
	}

	public static function get_token() {
		$encrypted = get_option( self::TOKEN_OPTION, '' );

		if ( empty( $encrypted ) ) {
			return null;
		}

		$token = self::decrypt( $encrypted );

		if ( empty( $token ) ) {
			error_log( 'Jug AI: stored auth token exists but decryption failed — encryption key may have changed. Clear the token via logout or re-authenticate.' );
			return null;
		}

		return $token;
	}

	public static function set_token( $jwt ) {
		$encrypted = self::encrypt( $jwt );

		if ( false === $encrypted ) {
			return false;
		}

		return update_option( self::TOKEN_OPTION, $encrypted );
	}

	public static function clear_token() {
		delete_option( self::TOKEN_OPTION );
		delete_option( self::USER_ID_OPTION );
		delete_option( self::USER_NAME_OPTION );
		delete_option( self::USER_EMAIL_OPTION );
	}

	public static function get_user_id() {
		return get_option( self::USER_ID_OPTION, null );
	}

	public static function set_user_id( $user_id ) {
		update_option( self::USER_ID_OPTION, sanitize_text_field( $user_id ) );
	}

	public static function set_user_info( $name, $email ) {
		update_option( self::USER_NAME_OPTION, sanitize_text_field( $name ) );
		update_option( self::USER_EMAIL_OPTION, sanitize_email( $email ) );
	}

	public static function get_user_info() {
		return array(
			'name'  => get_option( self::USER_NAME_OPTION, '' ),
			'email' => get_option( self::USER_EMAIL_OPTION, '' ),
		);
	}

	public static function get_defaults() {
		return array(
			'active_bot_uuid' => '',
			'widget_type'     => 'chatbot',
			'widget_enabled'  => false,
			'display_on'      => 'all',
			'display_pages'   => array(),
			'site_name'       => '',
		);
	}

	public static function get_settings() {
		$defaults = self::get_defaults();
		$stored   = get_option( self::SETTINGS_OPTION, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return wp_parse_args( $stored, $defaults );
	}

	public static function update_settings( $data ) {
		$current  = self::get_settings();
		$allowed  = array_keys( self::get_defaults() );
		$sanitized = array();

		foreach ( $allowed as $key ) {
			if ( isset( $data[ $key ] ) ) {
				switch ( $key ) {
					case 'active_bot_uuid':
					case 'widget_type':
					case 'display_on':
					case 'site_name':
						$sanitized[ $key ] = sanitize_text_field( $data[ $key ] );
						break;
					case 'widget_enabled':
						$sanitized[ $key ] = (bool) $data[ $key ];
						break;
					case 'display_pages':
						$sanitized[ $key ] = is_array( $data[ $key ] )
							? array_map( 'sanitize_text_field', $data[ $key ] )
							: array();
						break;
				}
			} else {
				$sanitized[ $key ] = $current[ $key ];
			}
		}

		return update_option( self::SETTINGS_OPTION, $sanitized );
	}

	public static function is_authenticated() {
		$token = self::get_token();
		return ! empty( $token );
	}

	public static function cleanup() {
		delete_option( self::TOKEN_OPTION );
		delete_option( self::USER_ID_OPTION );
		delete_option( self::USER_NAME_OPTION );
		delete_option( self::USER_EMAIL_OPTION );
		delete_option( self::SETTINGS_OPTION );
	}
}
