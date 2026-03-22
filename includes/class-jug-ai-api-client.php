<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Api_Client {

	private static function get_base_url() {
		$settings = Jug_AI_Settings::get_settings();
		if ( ! empty( $settings['custom_api_url'] ) ) {
			return rtrim( $settings['custom_api_url'], '/' );
		}
		return JUG_AI_API_BASE;
	}

	/**
	 * JSON headers for Jug API. When $with_bearer is false, omit Authorization (required for /auth/login, /auth/signup, /auth/verify).
	 *
	 * @param bool $with_bearer Whether to attach stored JWT when present.
	 */
	private static function json_headers( $with_bearer = true ) {
		$headers = array(
			'Content-Type' => 'application/json',
			'Accept'       => 'application/json',
		);

		if ( $with_bearer ) {
			$token = Jug_AI_Settings::get_token();
			if ( $token ) {
				$headers['Authorization'] = 'Bearer ' . $token;
			}
		}

		return $headers;
	}

	private static function request( $method, $endpoint, $body = null, $anonymous = false ) {
		$url  = self::get_base_url() . $endpoint;
		$args = array(
			'method'  => $method,
			'headers' => self::json_headers( ! $anonymous ),
			'timeout' => 60,
		);

		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );
		$data = json_decode( $raw, true );

		if ( $code >= 400 ) {
			$message = isset( $data['detail'] ) ? $data['detail'] : "API error ($code)";
			return new WP_Error( 'jug_ai_api_error', $message, array( 'status' => $code ) );
		}

		return $data;
	}

	private static function get( $endpoint ) {
		return self::request( 'GET', $endpoint );
	}

	private static function post( $endpoint, $body = array(), $anonymous = false ) {
		return self::request( 'POST', $endpoint, $body, $anonymous );
	}

	private static function put( $endpoint, $body = array() ) {
		return self::request( 'PUT', $endpoint, $body );
	}

	private static function delete( $endpoint ) {
		return self::request( 'DELETE', $endpoint );
	}

	// ── Auth ──

	public static function login( $contact ) {
		return self::post( '/auth/login', array( 'contact' => $contact ), true );
	}

	public static function signup( $name, $contact ) {
		return self::post( '/auth/signup', array(
			'name'    => $name,
			'contact' => $contact,
		), true );
	}

	public static function verify( $otp, $enc_str ) {
		$result = self::post( '/auth/verify', array(
			'otp'     => $otp,
			'enc_str' => $enc_str,
		), true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! empty( $result['access_token'] ) ) {
			Jug_AI_Settings::set_token( $result['access_token'] );
		}

		if ( ! empty( $result['user_id'] ) ) {
			Jug_AI_Settings::set_user_id( $result['user_id'] );
		}

		return $result;
	}

	public static function get_profile() {
		return self::get( '/profile' );
	}

	// ── Bots ──

	public static function get_bots() {
		return self::get( '/bots' );
	}

	public static function get_bot( $uuid ) {
		return self::get( '/bots/' . sanitize_text_field( $uuid ) );
	}

	public static function create_bot( $data ) {
		return self::post( '/bots', $data );
	}

	public static function update_bot( $uuid, $data ) {
		return self::put( '/bots/' . sanitize_text_field( $uuid ), $data );
	}

	public static function delete_bot( $uuid ) {
		return self::delete( '/bots/' . sanitize_text_field( $uuid ) );
	}

	public static function generate_prompt( $data ) {
		return self::post( '/bots/generate-prompt', $data );
	}

	public static function detect_cors( $url ) {
		return self::post( '/bots/detect-cors', array( 'url' => $url ) );
	}

	// ── Scrape ──

	public static function discover_urls( $website ) {
		return self::post( '/scrape/discover', array( 'website' => $website ) );
	}

	public static function analyze_site( $website ) {
		return self::post( '/scrape/analyze', array( 'website' => $website ) );
	}

	// ── Training ──

	public static function train_text( $uuid, $data ) {
		return self::post( '/training/' . sanitize_text_field( $uuid ) . '/text', $data );
	}

	// ── Conversations ──

	public static function get_sessions( $bot_uuid, $params = array() ) {
		$query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
		return self::get( '/conversations/' . sanitize_text_field( $bot_uuid ) . '/sessions' . $query );
	}

	public static function get_messages( $bot_uuid, $fingerprint ) {
		return self::get(
			'/conversations/' . sanitize_text_field( $bot_uuid )
			. '/sessions/' . sanitize_text_field( $fingerprint )
			. '/messages'
		);
	}

	public static function get_stats( $bot_uuid ) {
		return self::get( '/conversations/' . sanitize_text_field( $bot_uuid ) . '/stats' );
	}

	// ── Widget ──

	public static function get_widget( $bot_uuid ) {
		return self::get( '/d/widget/' . sanitize_text_field( $bot_uuid ) );
	}
}
