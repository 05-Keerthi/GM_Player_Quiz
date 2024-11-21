// Card.js
import React from "react";

const Card = ({ title, description, imageSrc, buttonText, onClick }) => (
  <div className="bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow duration-300 h-[500px] w-full max-w-[400px]">
    <h3 className="bg-[#3166c7] text-white text-center py-2 rounded-t-lg">
      {title}
    </h3>
    <img src={imageSrc} alt="card" className="h-[200px] w-full border-b-4" />
    <div className="p-5">
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        onClick={onClick}
      >
        {buttonText}
      </button>
    </div>
  </div>
);

export default Card;
