import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
          {/* Tree SVG Logo */}
          <span aria-label="Tree Logo" className="inline-block align-middle">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#256029"/>
              <ellipse cx="16" cy="14" rx="9" ry="7" fill="#43A047"/>
              <ellipse cx="16" cy="10" rx="6" ry="5" fill="#66BB6A"/>
              <rect x="14" y="18" width="4" height="8" rx="1.5" fill="#8D6E63"/>
            </svg>
          </span>
          <h1 className="text-2xl font-bold">Forest Impact Simulator</h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
