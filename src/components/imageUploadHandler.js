import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';

// useImageGallery Hook (Handles Image Gallery)
export const useImageGallery = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGalleryImages = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/media/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGalleryImages(response.data.media || []);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch gallery images');
      setIsLoading(false);
      console.error('Gallery fetch error:', err);
    }
  };

  const openGallery = () => {
    fetchGalleryImages();
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    setSelectedImage(null);
  };

  const selectImageFromGallery = (image) => {
    setSelectedImage(image);
    closeGallery();
  };

  const deleteGalleryImage = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/media/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGalleryImages((prev) => prev.filter((img) => img._id !== imageId));
      if (selectedImage?._id === imageId) {
        setSelectedImage(null);
      }
    } catch (err) {
      setError('Image deletion failed');
      console.error('Delete error:', err);
    }
  };

  return {
    galleryImages,
    selectedImage,
    isGalleryOpen,
    isLoading,
    error,
    openGallery,
    closeGallery,
    selectImageFromGallery,
    deleteGalleryImage,
  };
};

// useImageUpload Hook (Handles Image Upload)
export const useImageUpload = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return;

    setUploadStatus('uploading');
    try {
      // Upload image logic here, for example using axios to send the image to the backend
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadStatus('idle');
  };

  return {
    imageFile,
    imagePreview,
    uploadStatus,
    handleImageSelect,
    uploadImage,
    resetImage,
  };
};

// Image Gallery Modal Component
export const ImageGalleryModal = ({
  isOpen,
  images,
  onClose,
  onSelect,
  onDelete,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Image Gallery</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ImageIcon className="w-12 h-12 mb-4" />
            <p>No images in gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image._id} className="relative group cursor-pointer">
                <img
                  src={image.url}
                  alt="Gallery"
                  className="w-full h-40 object-cover rounded-lg group-hover:opacity-75 transition"
                  onClick={() => onSelect(image)}
                />
                <button
                  onClick={() => onDelete(image._id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Image Upload with Gallery Component
export const ImageUploadWithGallery = ({ 
  onImagePreviewChange, 
  onUploadStatusChange, 
  onImageSelect 
}) => {
  const {
    imageFile,
    imagePreview,
    uploadStatus,
    handleImageSelect,
    uploadImage,
    resetImage,
  } = useImageUpload();

  const {
    galleryImages,
    selectedImage,
    isGalleryOpen,
    isLoading,
    openGallery,
    closeGallery,
    selectImageFromGallery,
    deleteGalleryImage,
  } = useImageGallery();

  // Update preview when local image is selected
  useEffect(() => {
    if (imagePreview) {
      onImagePreviewChange?.(imagePreview);
    }
  }, [imagePreview, onImagePreviewChange]);

  // Update upload status
  useEffect(() => {
    onUploadStatusChange?.(uploadStatus);
  }, [uploadStatus, onUploadStatusChange]);

  const handleGalleryImageSelect = (image) => {
    selectImageFromGallery(image);
    onImageSelect?.(image);
    closeGallery();
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={openGallery}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            <ImageIcon className="w-5 h-5" />
            Open Gallery
          </button>

          <label
            htmlFor="image-upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition"
          >
            <Upload className="w-5 h-5" />
            Upload New Image
          </label>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="image-upload"
        />
      </div>

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        images={galleryImages}
        onClose={closeGallery}
        onSelect={handleGalleryImageSelect}
        onDelete={deleteGalleryImage}
        isLoading={isLoading}
      />
    </div>
  );
};



export default ImageUploadWithGallery;
