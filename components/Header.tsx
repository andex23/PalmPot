
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center p-6 bg-white shadow-md w-full">
            <div className="flex items-center justify-center gap-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M8.25 5.25a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.518c.896.16 1.73.52 2.461 1.038a.75.75 0 01-.73 1.28c-.52-.37-1.1-.643-1.731-.795v1.212a3 3 0 01-1.5 2.599V16.5a.75.75 0 01-1.5 0v-3.401a3 3 0 01-1.5-2.599V6.791c-.63.152-1.212.425-1.731.795a.75.75 0 11-.73-1.28c.73-.518 1.565-.878 2.461-1.038V5.25z" clipRule="evenodd" />
                    <path d="M12 21a8.25 8.25 0 005.65-2.263.75.75 0 10-1.04-1.08A6.75 6.75 0 0112 19.5a6.75 6.75 0 01-4.61-1.843.75.75 0 00-1.04 1.08A8.25 8.25 0 0012 21z" />
                    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">PalmPot</h1>
                    <p className="text-md text-gray-500">Your AI Nigerian Recipe Generator</p>
                </div>
            </div>
        </header>
    );
};

export default Header;