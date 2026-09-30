import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { MotionProvider } from './motion/MotionProvider';

// iOS Safari only applies :active (our press feedback) when a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MotionProvider>
            <App />
        </MotionProvider>
    </StrictMode>,
);
