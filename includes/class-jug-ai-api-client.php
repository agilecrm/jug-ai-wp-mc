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

		if ( null === $data && '' !== $raw ) {
			error_log( 'Jug AI: API returned non-JSON response for ' . $endpoint . ': ' . substr( $raw, 0, 200 ) );
			return new WP_Error( 'jug_ai_invalid_response', 'The Jug AI API returned an invalid response.', array( 'status' => 502 ) );
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

	public static function update_profile( $data ) {
		return self::put( '/profile', $data );
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

	/**
	 * Cascade-delete a site and all related data (embeddings, bots, chat histories, user profile entries).
	 */
	public static function delete_site( $uuid ) {
		return self::delete( '/sites/' . sanitize_text_field( $uuid ) );
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

	public static function get_training_embeddings( $uuid, $params = array() ) {
		$query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
		return self::get( '/training/' . sanitize_text_field( $uuid ) . '/embeddings' . $query );
	}

	public static function delete_embedding( $uuid, $embedding_id, $params = array() ) {
		$query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
		return self::delete( '/training/' . sanitize_text_field( $uuid ) . '/embedding/' . sanitize_text_field( $embedding_id ) . $query );
	}

	public static function delete_all_embeddings( $uuid, $params = array() ) {
		$query = ! empty( $params ) ? '?' . http_build_query( $params ) : '';
		return self::delete( '/training/' . sanitize_text_field( $uuid ) . '/embeddings' . $query );
	}

	public static function test_retrieval( $uuid, $embedding_type, $data ) {
		return self::post( '/training/' . sanitize_text_field( $uuid ) . '/' . sanitize_text_field( $embedding_type ) . '/retrieve', $data );
	}

	public static function add_training_bulk( $uuid, $data ) {
		return self::post( '/training/' . sanitize_text_field( $uuid ) . '/bulk', $data );
	}

	public static function upload_training_file( $file_path, $file_name, $file_type ) {
		$url     = self::get_base_url() . '/training/file/upload';
		$headers = self::json_headers( true );
		unset( $headers['Content-Type'] );

		$boundary = wp_generate_password( 24, false );
		$headers['Content-Type'] = 'multipart/form-data; boundary=' . $boundary;

		$body  = '--' . $boundary . "\r\n";
		$body .= 'Content-Disposition: form-data; name="file"; filename="' . $file_name . '"' . "\r\n";
		$body .= 'Content-Type: ' . $file_type . "\r\n\r\n";
		$body .= file_get_contents( $file_path ) . "\r\n";
		$body .= '--' . $boundary . '--' . "\r\n";

		$response = wp_remote_request( $url, array(
			'method'  => 'POST',
			'headers' => $headers,
			'body'    => $body,
			'timeout' => 60,
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );
		$data = json_decode( $raw, true );

		if ( $code >= 400 ) {
			$message = isset( $data['detail'] ) ? $data['detail'] : "Upload failed ($code)";
			return new WP_Error( 'jug_ai_api_error', $message, array( 'status' => $code ) );
		}

		return $data;
	}

	public static function train_file( $file_uuid, $embedding_type, $data ) {
		$query = ! empty( $embedding_type ) ? '?embedding_type=' . urlencode( $embedding_type ) : '';
		return self::post( '/training/file/' . sanitize_text_field( $file_uuid ) . '/train' . $query, $data );
	}

	public static function discover_urls_from_domain( $data ) {
		return self::post( '/scrape/discover', $data );
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
