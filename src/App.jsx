import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home';
import Dashboard from './Dashboard';
import FlyerView from './FlyerView';
import { isPromoMode } from './motion/promo';
import useClickFlash from './hooks/useClickFlash';
import './styles/motion.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
});

const App = () => {
    // One delegated listener for the whole app: flashes any `[data-flash]` icon
    // that is pressed (see hooks/useClickFlash.js + styles/motion.css).
    useClickFlash();

    return (
        // LazyMotion + `m.*` components keeps the bundle at the domAnimation
        // budget (no layout/drag features). `strict` makes accidental `motion.*`
        // usage fail loudly instead of silently pulling the full bundle in.
        // MotionConfig reducedMotion="user" honours the OS "reduce motion"
        // setting: transform animations are dropped, opacity fades are kept.
        // In capture mode (?promo=<speed>) it is forced to "never" so the take
        // recorded for social media always shows the animations.
        <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion={isPromoMode ? "never" : "user"}>
        <QueryClientProvider client={queryClient}>
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/product/:productId" element={<FlyerView />} />

            </Routes>
        </Router>
        </QueryClientProvider>
        </MotionConfig>
        </LazyMotion>
    );
};

export default App;