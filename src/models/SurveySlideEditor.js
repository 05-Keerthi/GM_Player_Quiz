// import React, { useState, useEffect } from "react";
// import { X, Trash2, Upload } from "lucide-react";

// const SurveySlideEditor = ({ slide, onUpdate, onClose }) => {
//   const [parsedSlide, setParsedSlide] = useState(() => ({
//     surveyTitle: slide?.surveyTitle || "",
//     surveyContent: slide?.surveyContent || "",
//     imageUrl: slide?.imageUrl || null,
//     position: slide?.position || 0,
//     imageFile: null
//   }));

//   const [imagePreview, setImagePreview] = useState(slide?.imageUrl || null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadError, setUploadError] = useState(null);

//   useEffect(() => {
//     if (slide) {
//       setParsedSlide({
//         surveyTitle: slide.surveyTitle || "",
//         surveyContent: slide.surveyContent || "",
//         imageUrl: slide.imageUrl || null,
//         position: slide.position || 0,
//         imageFile: null
//       });
//       setImagePreview(slide.imageUrl);
//     }
//   }, [slide]);

//   const handleInputChange = (field, value) => {
//     setParsedSlide((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleImageUpload = (event) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setIsUploading(true);
//       setUploadError(null);

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//         setParsedSlide((prev) => ({
//           ...prev,
//           imageFile: file,
//           imageUrl: reader.result,
//         }));
//         setIsUploading(false);
//       };
//       reader.onerror = () => {
//         setUploadError("Error reading file");
//         setIsUploading(false);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleImageRemove = () => {
//     setImagePreview(null);
//     setParsedSlide((prev) => ({
//       ...prev,
//       imageFile: null,
//       imageUrl: null,
//     }));
//   };

//   const handleSave = () => {
//     if (!parsedSlide.surveyTitle.trim()) {
//       setUploadError("Please enter a slide title");
//       return;
//     }

//     if (!parsedSlide.surveyContent.trim()) {
//       setUploadError("Please enter slide content");
//       return;
//     }

//     if (onUpdate) {
//       onUpdate(parsedSlide);
//     }
//     onClose();
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto">
//       <div className="flex items-center justify-between mb-6 border-b pb-4">
//         <h2 className="text-2xl font-bold text-gray-800">
//           {slide ? "Edit Slide" : "Add Slide"}
//         </h2>
//         <button
//           onClick={onClose}
//           className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//         >
//           <X className="w-6 h-6 text-gray-600" />
//         </button>
//       </div>

//       <div className="space-y-6">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Slide Title
//           </label>
//           <input
//             type="text"
//             value={parsedSlide.surveyTitle}
//             onChange={(e) => handleInputChange("surveyTitle", e.target.value)}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter slide title"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Content
//           </label>
//           <textarea
//             value={parsedSlide.surveyContent}
//             onChange={(e) => handleInputChange("surveyContent", e.target.value)}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-32"
//             placeholder="Enter slide content"
//             required
//           />
//         </div>

//         <div className="space-y-2">
//           <label className="block text-sm font-medium text-gray-700">
//             Slide Image (Optional)
//           </label>
//           {!imagePreview ? (
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
//               <label className="flex flex-col items-center justify-center cursor-pointer">
//                 <Upload className="w-8 h-8 text-gray-400 mb-2" />
//                 <span className="text-sm text-gray-500">
//                   {isUploading ? "Uploading..." : "Click to upload image"}
//                 </span>
//                 <input
//                   type="file"
//                   className="hidden"
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                   disabled={isUploading}
//                 />
//               </label>
//             </div>
//           ) : (
//             <div className="relative">
//               <img
//                 src={imagePreview}
//                 alt="Slide"
//                 className="w-full h-48 object-cover rounded-lg"
//               />
//               <button
//                 onClick={handleImageRemove}
//                 className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
//               >
//                 <Trash2 className="w-4 h-4" />
//               </button>
//             </div>
//           )}
//           {uploadError && (
//             <p className="text-red-500 text-sm mt-1">{uploadError}</p>
//           )}
//         </div>

//         <div className="flex justify-end gap-4 mt-6">
//           <button
//             onClick={handleSave}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//             disabled={isUploading}
//           >
//             {slide ? "Update Slide" : "Add Slide"}
//           </button>
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SurveySlideEditor;
// // import React, { useState, useEffect } from "react";
// // import { X, Trash2, Upload } from "lucide-react";
// // import { motion } from "framer-motion";

// // const SurveySlideEditor = ({ slide, onUpdate, onClose, onImageUpload }) => {
// //   const [parsedSlide, setParsedSlide] = useState(() => ({
// //     surveyTitle: slide?.surveyTitle || "",
// //     surveyContent: slide?.surveyContent || "",
// //     imageUrl: slide?.imageUrl || null,
// //     position: slide?.position || 0,
// //   }));

// //   const [isUploading, setIsUploading] = useState(false);
// //   const [uploadError, setUploadError] = useState(null);

// //   useEffect(() => {
// //     if (slide) {
// //       setParsedSlide({
// //         surveyTitle: slide.surveyTitle || "",
// //         surveyContent: slide.surveyContent || "",
// //         imageUrl: slide.imageUrl || null,
// //         position: slide.position || 0,
// //       });
// //     }
// //   }, [slide]);

// //   const handleInputChange = (field, value) => {
// //     setParsedSlide((prev) => ({
// //       ...prev,
// //       [field]: value,
// //     }));
// //   };

// //   const handleImageUpload = async (event) => {
// //     const file = event.target.files?.[0];
// //     if (file) {
// //       setIsUploading(true);
// //       setUploadError(null);

// //       try {
// //         // Assuming onImageUpload is a prop that handles the upload to your backend
// //         // and returns the Media document's _id
// //         const mediaId = await onImageUpload(file);
// //         setParsedSlide((prev) => ({
// //           ...prev,
// //           imageUrl: mediaId, // Store the Media document _id instead of the data URL
// //         }));
// //       } catch (error) {
// //         setUploadError("Error uploading file");
// //         console.error("Image upload failed:", error);
// //       } finally {
// //         setIsUploading(false);
// //       }
// //     }
// //   };

// //   const handleImageRemove = () => {
// //     setParsedSlide((prev) => ({
// //       ...prev,
// //       imageUrl: null,
// //     }));
// //   };

// //   const handleSave = () => {
// //     if (onUpdate) {
// //       const slideData = {
// //         ...parsedSlide,
// //         // Ensure we're only sending the expected fields
// //         surveyTitle: parsedSlide.surveyTitle,
// //         surveyContent: parsedSlide.surveyContent,
// //         imageUrl: parsedSlide.imageUrl, // This will be the Media document _id
// //         position: parsedSlide.position,
// //       };
// //       onUpdate(slideData);
// //     }
// //     onClose();
// //   };

// //   return (
// //     <motion.div
// //       initial={{ opacity: 0, y: 20 }}
// //       animate={{ opacity: 1, y: 0 }}
// //       exit={{ opacity: 0, y: 20 }}
// //       className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto"
// //     >
// //       <div className="flex items-center justify-between mb-6 border-b pb-4">
// //         <h2 className="text-2xl font-bold text-gray-800">
// //           {slide ? "Edit Slide" : "Add Slide"}
// //         </h2>
// //         <button
// //           onClick={onClose}
// //           className="p-2 hover:bg-gray-100 rounded-full transition-colors"
// //         >
// //           <X className="w-6 h-6 text-gray-600" />
// //         </button>
// //       </div>

// //       <div className="space-y-6">
// //         {/* Slide Title */}
// //         <div>
// //           <label className="block text-sm font-medium text-gray-700 mb-2">
// //             Slide Title
// //           </label>
// //           <input
// //             type="text"
// //             value={parsedSlide.surveyTitle}
// //             onChange={(e) => handleInputChange("surveyTitle", e.target.value)}
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
// //             placeholder="Enter slide title"
// //             required
// //           />
// //         </div>

// //         {/* Slide Content */}
// //         <div>
// //           <label className="block text-sm font-medium text-gray-700 mb-2">
// //             Content
// //           </label>
// //           <textarea
// //             value={parsedSlide.surveyContent}
// //             onChange={(e) => handleInputChange("surveyContent", e.target.value)}
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
// //             placeholder="Enter slide content"
// //             required
// //           />
// //         </div>

// //         {/* Image Upload */}
// //         <div className="space-y-2">
// //           <label className="block text-sm font-medium text-gray-700">
// //             Slide Image (Optional)
// //           </label>
// //           <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
// //             <label className="flex flex-col items-center justify-center cursor-pointer">
// //               <Upload className="w-8 h-8 text-gray-400 mb-2" />
// //               <span className="text-sm text-gray-500">
// //                 {isUploading ? "Uploading..." : "Click to upload image"}
// //               </span>
// //               <input
// //                 type="file"
// //                 className="hidden"
// //                 accept="image/*"
// //                 onChange={handleImageUpload}
// //                 disabled={isUploading}
// //               />
// //             </label>
// //           </div>
// //           {uploadError && (
// //             <p className="text-red-500 text-sm mt-1">{uploadError}</p>
// //           )}
// //           {parsedSlide.imageUrl && (
// //             <div className="flex items-center justify-between mt-2">
// //               <span className="text-sm text-gray-600">Image uploaded</span>
// //               <button
// //                 onClick={handleImageRemove}
// //                 className="p-2 text-red-500 hover:text-red-600"
// //               >
// //                 <Trash2 className="w-4 h-4" />
// //               </button>
// //             </div>
// //           )}
// //         </div>

// //         {/* Action Buttons */}
// //         <div className="flex justify-end gap-4 mt-6">
// //           <button
// //             onClick={handleSave}
// //             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
// //             disabled={isUploading}
// //           >
// //             {slide ? "Update Slide" : "Add Slide"}
// //           </button>
// //           <button
// //             onClick={onClose}
// //             className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
// //           >
// //             Cancel
// //           </button>
// //         </div>
// //       </div>
// //     </motion.div>
// //   );
// // };

// // export default SurveySlideEditor;
import React, { useState, useEffect } from "react";
import { X, Trash2, Upload } from "lucide-react";

const SurveySlideEditor = ({ slide, onUpdate, onClose }) => {
  const [parsedSlide, setParsedSlide] = useState(() => ({
    surveyTitle: slide?.surveyTitle || "",
    surveyContent: slide?.surveyContent || "",
    imageUrl: slide?.imageUrl || null,
    position: slide?.position || 0,
    imageFile: null,
    isImageDeleted: false // New flag to track if existing image should be deleted
  }));

  const [imagePreview, setImagePreview] = useState(slide?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (slide) {
      setParsedSlide({
        surveyTitle: slide.surveyTitle || "",
        surveyContent: slide.surveyContent || "",
        imageUrl: slide.imageUrl || null,
        position: slide.position || 0,
        imageFile: null,
        isImageDeleted: false
      });
      setImagePreview(slide.imageUrl);
    }
  }, [slide]);

  const handleInputChange = (field, value) => {
    setParsedSlide((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setParsedSlide((prev) => ({
          ...prev,
          imageFile: file,
          imageUrl: reader.result,
          isImageDeleted: false
        }));
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError("Error reading file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setParsedSlide((prev) => ({
      ...prev,
      imageFile: null,
      imageUrl: null,
      isImageDeleted: true // Mark image as deleted when removing
    }));
  };

  const handleSave = () => {
    if (!parsedSlide.surveyTitle.trim()) {
      setUploadError("Please enter a slide title");
      return;
    }

    if (!parsedSlide.surveyContent.trim()) {
      setUploadError("Please enter slide content");
      return;
    }

    if (onUpdate) {
      // Include all necessary information about the image state
      const slideData = {
        ...parsedSlide,
        imageUrl: parsedSlide.isImageDeleted ? null : parsedSlide.imageUrl,
      };
      onUpdate(slideData);
    }
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {slide ? "Edit Slide" : "Add Slide"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slide Title
          </label>
          <input
            type="text"
            value={parsedSlide.surveyTitle}
            onChange={(e) => handleInputChange("surveyTitle", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter slide title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={parsedSlide.surveyContent}
            onChange={(e) => handleInputChange("surveyContent", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-32"
            placeholder="Enter slide content"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Slide Image (Optional)
          </label>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {isUploading ? "Uploading..." : "Click to upload image"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Slide"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleImageRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {uploadError && (
            <p className="text-red-500 text-sm mt-1">{uploadError}</p>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isUploading}
          >
            {slide ? "Update Slide" : "Add Slide"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveySlideEditor;