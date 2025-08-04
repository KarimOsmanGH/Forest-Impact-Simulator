import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>&copy; 2024 Forest Future. All rights reserved.</p>
        {process.env.NEXT_PUBLIC_SECRET_MESSAGE && (
          <p className="text-xs mt-2">{process.env.NEXT_PUBLIC_SECRET_MESSAGE}</p>
        )}
      </div>
    </footer>
  );
};

export default Footer;
