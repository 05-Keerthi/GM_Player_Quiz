import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Type, ListOrdered, Upload, Trash2 } from 'lucide-react';

const ImageUploadArea = ({ image, setImage }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {!image ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload image</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      ) : (
        <div className="relative">
          <img
            src={image}
            alt="Slide"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const ClassicSlide = ({ title, setTitle, text, setText }) => {
  const [image, setImage] = useState(null);
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter title"
        className="w-full text-xl px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <ImageUploadArea image={image} setImage={setImage} />
      <textarea
        placeholder="Enter content"
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
    </div>
  );
};

const BigTitleSlide = ({ title, setTitle }) => {
  const [image, setImage] = useState(null);
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter big title"
        className="w-full text-4xl font-bold px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <ImageUploadArea image={image} setImage={setImage} />
    </div>
  );
};

const BulletPointsSlide = ({ title, setTitle, points, setPoints }) => {
  const [image, setImage] = useState(null);
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter title"
        className="w-full text-xl px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <ImageUploadArea image={image} setImage={setImage} />
      <div className="space-y-3">
        {points.map((point, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Bullet point ${index + 1}`}
              value={point}
              onChange={(e) => {
                const newPoints = [...points];
                newPoints[index] = e.target.value;
                setPoints(newPoints);
              }}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {points.length > 1 && (
              <button
                onClick={() => {
                  const newPoints = points.filter((_, i) => i !== index);
                  setPoints(newPoints);
                }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {points.length < 6 && (
          <button
            onClick={() => setPoints([...points, ''])}
            className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            Add Bullet Point
          </button>
        )}
      </div>
    </div>
  );
};

const SlideTypeModal = ({ isOpen, onClose, onAddSlide }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [points, setPoints] = useState(['']);
  const [error, setError] = useState(null);

  const slideTypes = [
    {
      id: 'classic',
      name: 'Classic',
      icon: ImageIcon,
      description: 'Give players more context or additional explanation'
    },
    {
      id: 'big_title',
      name: 'Big Title',
      icon: Type,
      description: 'Display large text with emphasis'
    },
    {
      id: 'bullet_points',
      name: 'Bullet Points',
      icon: ListOrdered,
      description: 'Present information in a structured list'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedType(null);
      setTitle('');
      setContent('');
      setPoints(['']);
      setError(null);
    }
  }, [isOpen]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      const slideData = {
        type: selectedType,
        title,
        content: selectedType === 'bullet_points' ? points.join('\n') : content
      };

      await onAddSlide(slideData);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 1 ? 'Select Slide Type' : 'Create Slide'}
          </h2>
          <button
            onClick={() => {
              if (step === 2) {
                setStep(1);
                setSelectedType(null);
              } else {
                onClose();
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slideTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="p-4 border rounded-lg text-left transition-all hover:border-blue-300"
              >
                <div className="flex items-center gap-3">
                  <type.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedType === 'classic' && (
              <ClassicSlide
                title={title}
                setTitle={setTitle}
                text={content}
                setText={setContent}
              />
            )}
            {selectedType === 'big_title' && (
              <BigTitleSlide
                title={title}
                setTitle={setTitle}
              />
            )}
            {selectedType === 'bullet_points' && (
              <BulletPointsSlide
                title={title}
                setTitle={setTitle}
                points={points}
                setPoints={setPoints}
              />
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={handleSubmit}
                disabled={!title}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Slide
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideTypeModal;