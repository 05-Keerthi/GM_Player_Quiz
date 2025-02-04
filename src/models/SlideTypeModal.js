import React from "react";
import {
  X,
  Image,
  Type,
  ListOrdered,
} from "lucide-react";
import { motion } from "framer-motion";

// Slide Type Selection Modal
export const SlideTypeModal = ({ isOpen, onClose, onTypeSelect }) => {
  const slideTypes = [
    {
      id: "classic",
      icon: Image,
      title: "Classic",
      description: "Give players more context or additional explanation",
    },
    {
      id: "big_title",
      icon: Type,
      title: "Big Title",
      description: "Display large text with emphasis",
    },
    {
      id: "bullet_points",
      icon: ListOrdered,
      title: "Bullet Points",
      description: "Present information in a structured list",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 relative z-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Select Slide Type
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slideTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                onTypeSelect(type.id);
                onClose();
              }}
              className="p-4 border rounded-lg text-left transition-all hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center gap-3">
                <type.icon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{type.title}</h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
