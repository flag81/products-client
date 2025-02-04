import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components for different pages
import Home from './Home';
import Dashboard from './Dashboard';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();


const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
        </Router>
        </QueryClientProvider>
    );
};

export default App;