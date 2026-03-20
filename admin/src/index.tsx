import { createRoot } from '@wordpress/element';
import App from './App';
import './styles/admin.css';

const container = document.getElementById('jug-ai-admin-root');
if (container) {
  createRoot(container).render(<App />);
}
