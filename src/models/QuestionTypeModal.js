


// import React, { useState, useContext, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { X, CheckSquare, ToggleLeft, MessageSquare, BarChart2, Upload, Trash2 } from 'lucide-react';

// const QuestionTypeModal = ({ isOpen, onClose, onAddQuestion, initialQuestion }) => {
//   const { quizId } = useParams();
//   const navigate = useNavigate();
//   const [selectedType, setSelectedType] = useState(null);
//   const [step, setStep] = useState(1);
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [question, setQuestion] = useState({
//     title: '',
//     type: '',
//     options: [],
//     correctAnswer: [],
//     points: 10,
//     timer: 10,
//     imageUrl: null,
//     quizId: quizId
//   });
//   const [uploadStatus, setUploadStatus] = useState('idle');
//   const [error, setError] = useState(null);
//   useEffect(() => {
//     if (isOpen) {
//       setSelectedType(null);
//       setStep(1);
//       setImageFile(null);
//       setImagePreview(null);
//       setQuestion({
//         title: '',
//         type: '',
//         options: [],
//         correctAnswer: [],
//         points: 10,
//         timer: 10,
//         imageUrl: null,
//         quizId: quizId
//       });
//     }
//   }, [isOpen, quizId]);

//   const questionTypes = [
//     {
//       id: 'multiple_choice',
//       icon: CheckSquare,
//       title: 'Multiple Choice',
//       description: 'One correct answer from multiple options'
//     },
//     {
//       id: 'multiple_select',
//       icon: CheckSquare,
//       title: 'Multiple Select',
//       description: 'Multiple correct answers can be selected'
//     },
//     {
//       id: 'true_false',
//       icon: ToggleLeft,
//       title: 'True/False',
//       description: 'Simple true or false question'
//     },
//     {
//       id: 'open_ended',
//       icon: MessageSquare,
//       title: 'Open Ended',
//       description: 'Free text response question'
//     },
//     {
//       id: 'poll',
//       icon: BarChart2,
//       title: 'Poll',
//       description: 'Gather opinions, no correct answer'
//     }
//   ];
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
      
//       // Create image preview
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeImage = () => {
//     setImageFile(null);
//     setImagePreview(null);
//     setQuestion(prev => ({
//       ...prev,
//       imageUrl: null
//     }));
//   };

//   const uploadImage = async () => {
//     if (!imageFile) return null;

//     const formData = new FormData();
//     formData.append('media', imageFile);

//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5000/api/media/upload', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Image upload failed');
//       }

//       const data = await response.json();
//       return data.media[0]._id; // Return the image ID
//     } catch (error) {
//       console.error('Image upload error:', error);
//       setError('Failed to upload image');
//       return null;
//     }
//   };

  
 
  
  
  

//   const handleTypeSelect = (type) => {
//     setSelectedType(type);
//     setQuestion(prev => ({
//       ...prev,
//       type: type,
//       options: type === 'true_false' ? 
//         [
//           { text: 'True', isCorrect: false },
//           { text: 'False', isCorrect: false }
//         ] : 
//         [{ text: '', isCorrect: false }]
//     }));
//     setStep(2);
//   };    

//   const handleOptionChange = (index, value) => {
//         setQuestion(prev => ({
//           ...prev,
//           options: prev.options.map((opt, i) => 
//             i === index ? { ...opt, text: value } : opt
//           )
//         }));
//       };
    
//       const handleCorrectAnswerChange = (index) => {
//         setQuestion(prev => {
//           if (prev.type === 'multiple_choice' || prev.type === 'true_false') {
//             // Single correct answer
//             const newOptions = prev.options.map((opt, i) => ({
//               ...opt,
//               isCorrect: i === index
//             }));
//             return { ...prev, options: newOptions };
//           } else {
//             // Multiple correct answers
//             const newOptions = prev.options.map((opt, i) => 
//               i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
//             );
//             return { ...prev, options: newOptions };
//           }
//         });
//       };
    
//       const addOption = () => {
//         setQuestion(prev => ({
//           ...prev,
//           options: [...prev.options, { text: '', isCorrect: false }]
//         }));
//       };
    
//       const removeOption = (index) => {
//         setQuestion(prev => ({
//           ...prev,
//           options: prev.options.filter((_, i) => i !== index)
//         }));
//       };
    

//     //   const handleSubmit = async () => {
//     //     try {
//     //       // Upload image if exists
//     //       const imageId = imageFile ? await uploadImage() : null;
    
//     //       const finalQuestion = {
//     //         ...question,
//     //         imageUrl: imageId,
//     //       };
    
//     //       // Validate and submit question
//     //       if (!finalQuestion.title) {
//     //         throw new Error('Question title is required');
//     //       }
    
//     //       await onAddQuestion(finalQuestion);
          
//     //       // Reset modal state
//     //       setSelectedType(null);
//     //       setStep(1);
//     //       setImageFile(null);
//     //       setImagePreview(null);
//     //       onClose();
//     //     } catch (error) {
//     //       setError(error.message);
//     //       console.error('Question submission error:', error);
//     //     }
//     //   };

//     const handleSubmit = async () => {
//         try {
//           // Upload image if exists
//           const imageId = imageFile ? await uploadImage() : null;
      
//           console.log('Image ID:', imageId); // Added console log
      
//           const finalQuestion = {
//             ...question,
//             imageUrl: imageId,
//           };
      
//           // Validate and submit question
//           if (!finalQuestion.title) {
//             throw new Error('Question title is required');
//           }
      
//           await onAddQuestion(finalQuestion);
          
//           // Reset modal state
//           setSelectedType(null);
//           setStep(1);
//           setImageFile(null);
//           setImagePreview(null);
//           onClose();
//         } catch (error) {
//           setError(error.message);
//           console.error('Question submission error:', error);
//         }
//       };
    
//       if (!isOpen) return null;
    
      
      
      
//       return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//             {error && (
//               <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//                 {error}
//               </div>
//             )}
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">
//                 {step === 1 ? 'Select Question Type' : 'Create Question'}
//               </h2>
//               <button
//                 onClick={() => {
//                   if (step === 2) {
//                     setStep(1);
//                     setSelectedType(null);
//                   } else {
//                     onClose();
//                   }
//                 }}
//                 className="p-1 hover:bg-gray-100 rounded-full"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
    
//             {step === 1 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {questionTypes.map((type) => (
//                   <button
//                     key={type.id}
//                     onClick={() => handleTypeSelect(type.id)}
//                     className="p-4 border rounded-lg text-left transition-all hover:border-blue-300"
//                   >
//                     <div className="flex items-center gap-3">
//                       <type.icon className="w-5 h-5 text-blue-600" />
//                       <div>
//                         <h3 className="font-medium">{type.title}</h3>
//                         <p className="text-sm text-gray-500">{type.description}</p>
//                     </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             ) : (
//           <div className="space-y-6">
//             {/* Question Title */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Question Text
//               </label>
//               <input
//                 type="text"
//                 value={question.title}
//                 onChange={(e) => setQuestion({ ...question, title: e.target.value })}
//                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your question here..."
//               />
//             </div>

//             {/* Image Upload Section */}
//             <div className="space-y-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Question Image (Optional)
//               </label>
//               {!imagePreview ? (
//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
//                   <label className="flex flex-col items-center justify-center cursor-pointer">
//                     <Upload className="w-8 h-8 text-gray-400 mb-2" />
//                     <span className="text-sm text-gray-500">Click to upload image</span>
//                     <input
//                       type="file"
//                       className="hidden"
//                       accept="image/*"
//                       onChange={handleImageUpload}
//                     />
//                   </label>
//                 </div>
//               ) : (
//                 <div className="relative">
//                   <img
//                     src={imagePreview}
//                     alt="Question"
//                     className="w-full h-48 object-cover rounded-lg"
//                   />
//                   <button
//                     onClick={removeImage}
//                     className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               )}
//             </div>
//             {selectedType !== 'open_ended' && (
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <label className="block text-sm font-medium text-gray-700">Options</label>
//                   {!['true_false', 'poll'].includes(selectedType) && (
//                     <button
//                       onClick={addOption}
//                       className="text-sm text-blue-600 hover:text-blue-700"
//                     >
//                       Add Option
//                     </button>
//                   )}
//                 </div>
//                 {question.options.map((option, index) => (
//                   <div key={index} className="flex items-center gap-3">
//                     <input
//                       type={selectedType === 'multiple_select' ? 'checkbox' : 'radio'}
//                       checked={option.isCorrect}
//                       onChange={() => handleCorrectAnswerChange(index)}
//                       className="w-4 h-4 text-blue-600"
//                       disabled={selectedType === 'poll'}
//                     />
//                     <input
//                       type="text"
//                       value={option.text}
//                       onChange={(e) => handleOptionChange(index, e.target.value)}
//                       className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder={`Option ${index + 1}`}
//                     />
//                     {!['true_false', 'poll'].includes(selectedType) && question.options.length > 1 && (
//                       <button
//                         onClick={() => removeOption(index)}
//                         className="p-1 text-gray-400 hover:text-red-500"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Open-ended correct answer */}
//             {selectedType === 'open_ended' && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Correct Answer
//                 </label>
//                 <input
//                   type="text"
//                   value={question.correctAnswer}
//                   onChange={(e) => setQuestion({ ...question, correctAnswer: e.target.value })}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Enter the correct answer..."
//                 />
//               </div>
//             )}

//             {/* Points and Timer */}
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Points
//                 </label>
//                 <input
//                   type="number"
//                   value={question.points}
//                   onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) })}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   min="0"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Timer (seconds)
//                 </label>
//                 <input
//                   type="number"
//                   value={question.timer}
//                   onChange={(e) => setQuestion({ ...question, timer: parseInt(e.target.value) })}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   min="0"
//                 />
//               </div>
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={!question.title || (selectedType !== 'open_ended' && question.options.some(opt => !opt.text))}
//               className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
//             >
//               Create Question
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuestionTypeModal;

import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, CheckSquare, ToggleLeft, MessageSquare, BarChart2, Upload, Trash2 } from 'lucide-react';
import { ImageUploadWithGallery } from '../components/imageUploadHandler';

const QuestionTypeModal = ({ isOpen, onClose, onAddQuestion, initialQuestion }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [question, setQuestion] = useState({
    title: '',
    type: '',
    options: [],
    correctAnswer: [],
    points: 10,
    timer: 10,
    imageUrl: null,
    quizId: quizId
  });
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [error, setError] = useState(null);
  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setStep(1);
      setImageFile(null);
      setImagePreview(null);
      setQuestion({
        title: '',
        type: '',
        options: [],
        correctAnswer: [],
        points: 10,
        timer: 10,
        imageUrl: null,
        quizId: quizId
      });
    }
  }, [isOpen, quizId]);

  const questionTypes = [
    {
      id: 'multiple_choice',
      icon: CheckSquare,
      title: 'Multiple Choice',
      description: 'One correct answer from multiple options'
    },
    {
      id: 'multiple_select',
      icon: CheckSquare,
      title: 'Multiple Select',
      description: 'Multiple correct answers can be selected'
    },
    {
      id: 'true_false',
      icon: ToggleLeft,
      title: 'True/False',
      description: 'Simple true or false question'
    },
    {
      id: 'open_ended',
      icon: MessageSquare,
      title: 'Open Ended',
      description: 'Free text response question'
    },
    {
      id: 'poll',
      icon: BarChart2,
      title: 'Poll',
      description: 'Gather opinions, no correct answer'
    }
  ];
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setQuestion(prev => ({
      ...prev,
      imageUrl: null
    }));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('media', imageFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/media/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.media[0]._id; // Return the image ID
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
      return null;
    }
  };

  
 
  
  
  

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setQuestion(prev => ({
      ...prev,
      type: type,
      options: type === 'true_false' ? 
        [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: false }
        ] : 
        [{ text: '', isCorrect: false }]
    }));
    setStep(2);
  };    

  const handleOptionChange = (index, value) => {
        setQuestion(prev => ({
          ...prev,
          options: prev.options.map((opt, i) => 
            i === index ? { ...opt, text: value } : opt
          )
        }));
      };
    
      const handleCorrectAnswerChange = (index) => {
        setQuestion(prev => {
          if (prev.type === 'multiple_choice' || prev.type === 'true_false') {
            // Single correct answer
            const newOptions = prev.options.map((opt, i) => ({
              ...opt,
              isCorrect: i === index
            }));
            return { ...prev, options: newOptions };
          } else {
            // Multiple correct answers
            const newOptions = prev.options.map((opt, i) => 
              i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
            );
            return { ...prev, options: newOptions };
          }
        });
      };
    
      const addOption = () => {
        setQuestion(prev => ({
          ...prev,
          options: [...prev.options, { text: '', isCorrect: false }]
        }));
      };
    
      const removeOption = (index) => {
        setQuestion(prev => ({
          ...prev,
          options: prev.options.filter((_, i) => i !== index)
        }));
      };
    

    //   const handleSubmit = async () => {
    //     try {
    //       // Upload image if exists
    //       const imageId = imageFile ? await uploadImage() : null;
    
    //       const finalQuestion = {
    //         ...question,
    //         imageUrl: imageId,
    //       };
    
    //       // Validate and submit question
    //       if (!finalQuestion.title) {
    //         throw new Error('Question title is required');
    //       }
    
    //       await onAddQuestion(finalQuestion);
          
    //       // Reset modal state
    //       setSelectedType(null);
    //       setStep(1);
    //       setImageFile(null);
    //       setImagePreview(null);
    //       onClose();
    //     } catch (error) {
    //       setError(error.message);
    //       console.error('Question submission error:', error);
    //     }
    //   };

    const handleImagePreviewChange = (preview) => {
          setImagePreview(preview);
        };

      const handleImageSelect = (image) => {
  setSelectedImage(image);
  setImagePreview(image.url);
  setQuestion(prev => ({
    ...prev,
    imageUrl: image._id || image.url // Prefer the _id if available
  }));
};
          

    const handleSubmit = async () => {
        try {
          // Upload image if exists
          const imageId = imageFile ? await uploadImage() : question.imageUrl;
      
          console.log('Image ID:', imageId); // Added console log
      
          
    const finalQuestion = {
      ...question,
      imageUrl: imageId, // This now supports both upload and gallery selection
    }
      
          // Validate and submit question
          if (!finalQuestion.title) {
            throw new Error('Question title is required');
          }
      
          await onAddQuestion(finalQuestion);
          
          // Reset modal state
          setSelectedType(null);
          setStep(1);
          setImageFile(null);
          setImagePreview(null);
          onClose();
        } catch (error) {
          setError(error.message);
          console.error('Question submission error:', error);
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
                {step === 1 ? 'Select Question Type' : 'Create Question'}
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
                {questionTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="p-4 border rounded-lg text-left transition-all hover:border-blue-300"
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{type.title}</h3>
                        <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
          <div className="space-y-6">
            {/* Question Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <input
                type="text"
                value={question.title}
                onChange={(e) => setQuestion({ ...question, title: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your question here..."
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Question Image (Optional)
              </label>
              <ImageUploadWithGallery
                onImagePreviewChange={handleImagePreviewChange}
                onUploadStatusChange={setUploadStatus}
                onImageSelect={handleImageSelect}
              />
              {!imagePreview ? (
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
                    src={imagePreview}
                    alt="Question"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {selectedType !== 'open_ended' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  {!['true_false', 'poll'].includes(selectedType) && (
                    <button
                      onClick={addOption}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add Option
                    </button>
                  )}
                </div>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type={selectedType === 'multiple_select' ? 'checkbox' : 'radio'}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="w-4 h-4 text-blue-600"
                      disabled={selectedType === 'poll'}
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    {!['true_false', 'poll'].includes(selectedType) && question.options.length > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Open-ended correct answer */}
            {selectedType === 'open_ended' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) => setQuestion({ ...question, correctAnswer: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the correct answer..."
                />
              </div>
            )}

            {/* Points and Timer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timer (seconds)
                </label>
                <input
                  type="number"
                  value={question.timer}
                  onChange={(e) => setQuestion({ ...question, timer: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!question.title || (selectedType !== 'open_ended' && question.options.some(opt => !opt.text))}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionTypeModal;




