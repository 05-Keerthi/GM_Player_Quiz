import React, { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";

// Predefined color palette
const PREDEFINED_COLORS = [
  // Bright Colors
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Medium Turquoise
  "#45B7D1", // Sky Blue
  "#96CEB4", // Sage Green
  "#FFEEAD", // Light Yellow

  // Soft Colors
  "#D4A5A5", // Dusty Rose
  "#9B97B2", // Soft Purple
  "#D3F3F1", // Light Mint
  "#E9D985", // Soft Yellow
  "#E8998D", // Soft Coral
];

const ColorPicker = ({ color, onChange, className = "" }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate if the current color is dark
  const isColorDark = (hexColor) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // Handle color change
  const handleColorChange = (newColor) => {
    onChange(newColor);
    setShowPicker(false);
  };

  return (
    <div className={`relative ${className} `} ref={pickerRef}>
      {/* Color picker trigger button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 rounded-lg border hover:shadow-md transition-all duration-200 relative"
        style={{ backgroundColor: color }}
        aria-label="Open color picker"
      >
        <Palette
          className="w-5 h-5"
          style={{
            color: isColorDark(color) ? "#ffffff" : "#000000",
            transition: "color 0.2s ease",
          }}
        />
      </button>

      {/* Color picker dropdown */}
      {showPicker && (
        <div className="absolute right-0 mt-2 p-3 bg-white rounded-lg shadow-xl border z-50 min-w-[240px]">
          {/* Custom color input */}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">
              Custom Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-10 cursor-pointer rounded border p-1"
            />
          </div>

          {/* Predefined colors */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Preset Colors
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PREDEFINED_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange(presetColor)}
                  className={`
                    w-8 h-8 rounded-lg border-2 
                    hover:scale-110 transition-transform duration-200
                    ${
                      color === presetColor
                        ? "border-blue-500 shadow-md"
                        : "border-transparent"
                    }
                  `}
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Current color display */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Selected Color:</span>
              <span className="text-sm font-mono">{color.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
