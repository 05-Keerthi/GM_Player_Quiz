import React from "react";
import { ChevronRight } from "lucide-react";

const Card = ({ icon, title, description, features, buttonText, onClick, bgColor }) => (
  <div className={`relative p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${bgColor}`}>
    <div className="absolute top-4 right-4">
      {icon}
    </div>
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
      <ul className="space-y-2 text-white/90 text-sm">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight size={16} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={onClick}
        className="w-full mt-4 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
      >
        {buttonText}
      </button>
    </div>
  </div>
);

export default Card;
