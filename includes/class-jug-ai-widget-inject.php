<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jug_AI_Widget_Inject {

	public function __construct() {
		add_action( 'wp_footer', array( $this, 'render_widget' ) );
	}

	public function render_widget() {
		if ( is_admin() ) {
			return;
		}

		$settings = Jug_AI_Settings::get_settings();

		if ( empty( $settings['widget_enabled'] ) ) {
			return;
		}

		$bot_uuid = $settings['active_bot_uuid'] ?? '';

		if ( empty( $bot_uuid ) ) {
			return;
		}

		if ( ! $this->should_display( $settings ) ) {
			return;
		}

		$widget_type = $settings['widget_type'] ?? 'chatbot';
		$base_url    = JUG_AI_WIDGET_BASE;

		if ( 'agent' === $widget_type ) {
			printf(
				'<script id="jug-ai-agent" src="%s/agent.min.js" data-bot="%s"></script>',
				esc_url( $base_url ),
				esc_attr( $bot_uuid )
			);
		} else {
			printf(
				'<script id="jug-ai-chat" src="%s/chat.min.js" data-bot="%s"></script>',
				esc_url( $base_url ),
				esc_attr( $bot_uuid )
			);
		}
	}

	private function should_display( $settings ) {
		$display_on = $settings['display_on'] ?? 'all';
		$pages      = $settings['display_pages'] ?? array();

		if ( 'all' === $display_on ) {
			return true;
		}

		$current_id   = (string) get_the_ID();
		$current_slug = get_post_field( 'post_name', get_the_ID() );
		$page_matches = in_array( $current_id, $pages, true )
			|| in_array( $current_slug, $pages, true );

		if ( 'specific' === $display_on ) {
			return $page_matches;
		}

		if ( 'exclude' === $display_on ) {
			return ! $page_matches;
		}

		return true;
	}
}
