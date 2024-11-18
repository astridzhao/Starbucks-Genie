import React from 'react';
import Menu from './components/Menu';  // Your existing menu component
import Header from './components/Header';
const MainLayout = ({ children }) => {
    return (
        <div>
            <Header />
            <Menu />
            <div>
                {children} 
            </div>
        </div>
    );
};

export default MainLayout;
