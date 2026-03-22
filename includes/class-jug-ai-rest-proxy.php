<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Rest_Proxy {

	const NAMESPACE = 'jug-ai/v1';

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		// ── Auth ──
		register_rest_route( self::NAMESPACE, '/auth/login', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'auth_login' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/signup', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'auth_signup' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/verify', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'auth_verify' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/auth/logout', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'auth_logout' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		// ── Bots ──
		register_rest_route( self::NAMESPACE, '/bots', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_bots' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_bot' ),
				'permission_callback' => array( $this, 'check_admin' ),
			),
		) );

		// Static /bots/* routes must be registered before /bots/(uuid) so "generate-prompt" is not captured as a UUID.
		register_rest_route( self::NAMESPACE, '/bots/generate-prompt', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'generate_prompt' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/bots/detect-cors', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'detect_cors' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );

		register_rest_route( self::NAMESPACE, '/bots/(?P<uuid>[a-zA-Z0-9\-]+)', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_bot' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
			array(
				'methods'             => 'PUT',
				'callback'            => array( $this, 'update_bot' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'delete_bot' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
		) );

		// ── Sites (cascade delete) ──
		register_rest_route( self::NAMESPACE, '/sites/(?P<uuid>[a-zA-Z0-9\-]+)', array(
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'delete_site' ),
				'permission_callback' => array( $this, 'check_authenticated' ),
			),
		) );

		// ── Chat ──
		register_rest_route( self::NAMESPACE, '/chat/stream-url', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'chat_stream_url' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		// ── Scrape ──
		register_rest_route( self::NAMESPACE, '/scrape/discover', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'scrape_discover' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/scrape/analyze', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'scrape_analyze' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/scrape/stream-url', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'scrape_stream_url' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		// ── Training ──
		register_rest_route( self::NAMESPACE, '/training/site/(?P<site_uuid>[a-zA-Z0-9\-]+)/stream-url', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'training_stream_url' ),
			'permission_callback' => array( $this, 'check_admin' ),
		) );

		register_rest_route( self::NAMESPACE, '/training/(?P<uuid>[a-zA-Z0-9\-]+)/text', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'train_text' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );

		// ── Conversations ──
		register_rest_route( self::NAMESPACE, '/conversations/(?P<uuid>[a-zA-Z0-9\-]+)/sessions', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_sessions' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );

		register_rest_route( self::NAMESPACE, '/conversations/(?P<uuid>[a-zA-Z0-9\-]+)/sessions/(?P<fp>[a-zA-Z0-9\-_]+)/messages', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_messages' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );

		register_rest_route( self::NAMESPACE, '/conversations/(?P<uuid>[a-zA-Z0-9\-]+)/stats', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_stats' ),
			'permission_callback' => array( $this, 'check_authenticated' ),
		) );

		// ── Local Settings ──
		register_rest_route( self::NAMESPACE, '/settings', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_admin' ),
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'check_admin' ),
			),
		) );
	}

	// ── Permission Callbacks ──

	public function check_admin() {
		return current_user_can( 'manage_options' );
	}

	public function check_authenticated() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to access this resource.', 'jug-ai' ),
				array( 'status' => 403 )
			);
		}

		if ( ! Jug_AI_Settings::is_authenticated() ) {
			return new WP_Error(
				'jug_ai_not_authenticated',
				__( 'Jug.ai session expired or not found. Please log in again.', 'jug-ai' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	// ── Helper ──

	private function respond( $result ) {
		if ( is_wp_error( $result ) ) {
			$status = $result->get_error_data( 'status' ) ?? 500;
			return new WP_REST_Response(
				array( 'error' => $result->get_error_message() ),
				is_array( $status ) ? 500 : (int) $status
			);
		}

		return new WP_REST_Response( $result, 200 );
	}

	// ── Auth Callbacks ──

	public function auth_login( WP_REST_Request $request ) {
		$contact = sanitize_text_field( $request->get_param( 'contact' ) );

		if ( empty( $contact ) ) {
			return new WP_REST_Response( array( 'error' => 'Contact is required.' ), 400 );
		}

		return $this->respond( Jug_AI_Api_Client::login( $contact ) );
	}

	public function auth_signup( WP_REST_Request $request ) {
		$name    = sanitize_text_field( $request->get_param( 'name' ) );
		$contact = sanitize_text_field( $request->get_param( 'contact' ) );

		if ( empty( $name ) || empty( $contact ) ) {
			return new WP_REST_Response( array( 'error' => 'Name and contact are required.' ), 400 );
		}

		return $this->respond( Jug_AI_Api_Client::signup( $name, $contact ) );
	}

	public function auth_verify( WP_REST_Request $request ) {
		$otp     = sanitize_text_field( $request->get_param( 'otp' ) );
		$enc_str = sanitize_text_field( $request->get_param( 'enc_str' ) );

		if ( empty( $otp ) || empty( $enc_str ) ) {
			return new WP_REST_Response( array( 'error' => 'OTP and enc_str are required.' ), 400 );
		}

		$result = Jug_AI_Api_Client::verify( $otp, $enc_str );

		if ( is_wp_error( $result ) ) {
			return $this->respond( $result );
		}

		$req_name  = sanitize_text_field( $request->get_param( 'name' ) );
		$req_email = sanitize_text_field( $request->get_param( 'contact' ) );

		$name  = $req_name;
		$email = $req_email;

		$profile = Jug_AI_Api_Client::get_profile();
		if ( ! is_wp_error( $profile ) ) {
			if ( ! empty( $profile['name'] ) ) {
				$name = sanitize_text_field( $profile['name'] );
			}
			if ( ! empty( $profile['email'] ) ) {
				$email = sanitize_email( $profile['email'] );
			}
		}

		if ( ! empty( $name ) || ! empty( $email ) ) {
			Jug_AI_Settings::set_user_info( $name, $email );
		}

		return new WP_REST_Response( array(
			'status' => 'verified',
			'name'   => $name,
			'email'  => $email,
		), 200 );
	}

	public function auth_logout( WP_REST_Request $request ) {
		Jug_AI_Settings::clear_token();
		return new WP_REST_Response( array( 'status' => 'logged_out' ), 200 );
	}

	// ── Bot Callbacks ──

	public function get_bots( WP_REST_Request $request ) {
		$profile = Jug_AI_Api_Client::get_profile();

		if ( is_wp_error( $profile ) ) {
			return $this->respond( $profile );
		}

		// The /profile endpoint returns the full user object which contains bots.
		// Pass the whole profile so the frontend can extract bots from any nested key.
		return $this->respond( $profile );
	}

	public function create_bot( WP_REST_Request $request ) {
		$body = $request->get_json_params();
		return $this->respond( Jug_AI_Api_Client::create_bot( $body ) );
	}

	public function get_bot( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		return $this->respond( Jug_AI_Api_Client::get_bot( $uuid ) );
	}

	public function update_bot( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		$body = $request->get_json_params();
		return $this->respond( Jug_AI_Api_Client::update_bot( $uuid, $body ) );
	}

	public function delete_bot( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		return $this->respond( Jug_AI_Api_Client::delete_bot( $uuid ) );
	}

	public function delete_site( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		$result = Jug_AI_Api_Client::delete_site( $uuid );

		// On successful cascade delete, clear local wp_options site config.
		if ( ! is_wp_error( $result ) ) {
			Jug_AI_Settings::update_settings( array(
				'site_name'      => '',
				'active_bot_uuid' => '',
				'widget_enabled'  => false,
			) );
		}

		return $this->respond( $result );
	}

	public function generate_prompt( WP_REST_Request $request ) {
		$body = $request->get_json_params();
		return $this->respond( Jug_AI_Api_Client::generate_prompt( $body ) );
	}

	public function detect_cors( WP_REST_Request $request ) {
		$url = esc_url_raw( $request->get_param( 'url' ) );
		return $this->respond( Jug_AI_Api_Client::detect_cors( $url ) );
	}

	// ── Chat Callbacks ──

	public function chat_stream_url( WP_REST_Request $request ) {
		$token    = Jug_AI_Settings::get_token();
		$base_url = defined( 'JUG_AI_API_BASE' ) ? JUG_AI_API_BASE : 'https://app.jug.ai/api';

		return new WP_REST_Response( array(
			'url'   => $base_url . '/chat/stream',
			'token' => $token ?: '',
		), 200 );
	}

	// ── Scrape Callbacks ──

	public function scrape_discover( WP_REST_Request $request ) {
		$website = esc_url_raw( $request->get_param( 'website' ) );
		return $this->respond( Jug_AI_Api_Client::discover_urls( $website ) );
	}

	public function scrape_analyze( WP_REST_Request $request ) {
		$website = esc_url_raw( $request->get_param( 'website' ) );
		return $this->respond( Jug_AI_Api_Client::analyze_site( $website ) );
	}

	public function scrape_stream_url( WP_REST_Request $request ) {
		$token    = Jug_AI_Settings::get_token();
		$base_url = defined( 'JUG_AI_API_BASE' ) ? JUG_AI_API_BASE : 'https://app.jug.ai/api';

		return new WP_REST_Response( array(
			'url'   => $base_url . '/scrape/stream',
			'token' => $token ?: '',
		), 200 );
	}

	// ── Training Callbacks ──

	public function training_stream_url( WP_REST_Request $request ) {
		$token     = Jug_AI_Settings::get_token();
		$base_url  = defined( 'JUG_AI_API_BASE' ) ? JUG_AI_API_BASE : 'https://app.jug.ai/api';
		$site_uuid = sanitize_text_field( $request->get_param( 'site_uuid' ) );

		return new WP_REST_Response( array(
			'url'   => $base_url . '/training/site/' . $site_uuid . '/stream',
			'token' => $token ?: '',
		), 200 );
	}

	public function train_text( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		$body = $request->get_json_params();
		return $this->respond( Jug_AI_Api_Client::train_text( $uuid, $body ) );
	}

	// ── Conversation Callbacks ──

	public function get_sessions( WP_REST_Request $request ) {
		$uuid   = sanitize_text_field( $request->get_param( 'uuid' ) );
		$params = array();

		$page = $request->get_param( 'page' );
		if ( $page ) {
			$params['page'] = absint( $page );
		}

		$search = $request->get_param( 'search' );
		if ( $search ) {
			$params['search'] = sanitize_text_field( $search );
		}

		$date_from = $request->get_param( 'date_from' );
		if ( $date_from ) {
			$params['date_from'] = sanitize_text_field( $date_from );
		}

		$date_to = $request->get_param( 'date_to' );
		if ( $date_to ) {
			$params['date_to'] = sanitize_text_field( $date_to );
		}

		return $this->respond( Jug_AI_Api_Client::get_sessions( $uuid, $params ) );
	}

	public function get_messages( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		$fp   = sanitize_text_field( $request->get_param( 'fp' ) );
		return $this->respond( Jug_AI_Api_Client::get_messages( $uuid, $fp ) );
	}

	public function get_stats( WP_REST_Request $request ) {
		$uuid = sanitize_text_field( $request->get_param( 'uuid' ) );
		return $this->respond( Jug_AI_Api_Client::get_stats( $uuid ) );
	}

	// ── Local Settings Callbacks ──

	public function get_settings( WP_REST_Request $request ) {
		return new WP_REST_Response( array(
			'settings'    => Jug_AI_Settings::get_settings(),
			'isLoggedIn'  => Jug_AI_Settings::is_authenticated(),
		), 200 );
	}

	public function update_settings( WP_REST_Request $request ) {
		$body = $request->get_json_params();
		Jug_AI_Settings::update_settings( $body );

		return new WP_REST_Response( array(
			'settings' => Jug_AI_Settings::get_settings(),
		), 200 );
	}
}
