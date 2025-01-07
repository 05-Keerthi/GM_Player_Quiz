import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div
      data-testid="not-found-container"
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4"
    >
      <div data-testid="not-found-content" className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h1 className="text-2xl text-gray-600 mb-6">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};
