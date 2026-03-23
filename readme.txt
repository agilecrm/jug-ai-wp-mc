=== Jug.ai - AI Chatbot ===
Contributors: jugai
Tags: chatbot, ai, customer support, live chat, artificial intelligence
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add an AI chatbot trained on your website content. Powered by Jug.ai.

== Description ==

Jug.ai lets you create an AI-powered chatbot that learns from your website content and answers visitor questions automatically.

**Features:**

* One-click website scraping and training
* AI-generated system prompts tailored to your business
* Real-time chat widget on your WordPress site
* Conversation analytics and session tracking
* Multiple bot support
* Chatbot and AI Agent widget modes

== External Services ==

This plugin relies on the [Jug.ai](https://jug.ai) third-party service to provide its core functionality. The following data is transmitted to `https://app.jug.ai/api`:

* **Authentication** – email or phone number for OTP-based login/signup.
* **Website scraping** – your site URLs are sent so the service can crawl and index page content for chatbot training.
* **Chat processing** – visitor chat messages are forwarded to the Jug.ai API and AI-generated responses are returned.
* **Analytics** – conversation session metadata (timestamps, message counts) is stored on Jug.ai servers.

No WordPress user accounts, passwords, or database contents are shared beyond what the site administrator explicitly configures.

By using this plugin you agree to the Jug.ai terms:

* [Jug.ai Privacy Policy](https://api.jug.ai/privacy-policy)

== Installation ==

1. Upload the `jug-ai` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to the 'Jug.ai' menu item in your admin sidebar
4. Create an account or log in with your existing Jug.ai credentials
5. Follow the onboarding wizard to train your chatbot

== Frequently Asked Questions ==

= Do I need a Jug.ai account? =

Yes. The plugin connects to the Jug.ai backend service which handles AI model hosting, chat processing, and analytics.

= What data is sent to Jug.ai? =

During setup, your website URLs are scraped to train the chatbot. Visitor chat messages are processed through Jug.ai's API. No personal WordPress data is shared.

= Can I use this with any theme? =

Yes. The chat widget is injected via wp_footer and works with any WordPress theme, including block themes.

== Changelog ==

= 1.0.0 =
* Initial release
