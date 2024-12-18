import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useNotificationContext } from "../context/notificationContext";

const InviteModal = ({ isOpen, onClose, sessionData, onInvite }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [localError, setLocalError] = useState("");

  const {
    user: currentUser,
    listUsers,
    users,
    loading,
    error,
  } = useAuthContext();
  const { createNotification } = useNotificationContext();

  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setLocalError("");
      setSearchQuery("");
      setSelectedUsers([]);
      // Fetch users list
      listUsers();
    }
  }, [isOpen]);
  
  // Add this to see what's happening with users
  useEffect(() => {
    console.log("Current users:", users);
    console.log("Current filtered users:", filteredUsers);
  }, [users, filteredUsers]);



  useEffect(() => {
    if (isOpen) {
      console.log("Received session data:", sessionData);
      
      // Check if this is a quiz session or survey session
      const validSessionId = sessionData?.sessionId || sessionData?._id;
      const isValid = !!validSessionId;

      if (!isValid) {
        console.error("Invalid session data received:", sessionData);
        setLocalError("Invalid session data");
        onClose();
      }
    }
  }, [isOpen, sessionData, onClose]);

  useEffect(() => {
    if (isOpen && !sessionData?.sessionId) {
      setLocalError("Invalid session data");
      onClose();
    }
  }, [isOpen, sessionData, onClose]);

  useEffect(() => {
    if (users) {
      const filtered = users
        .filter((user) => user._id !== currentUser?._id)
        .filter(
          (user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery, currentUser]);

  const handleUserSelect = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

const handleInvite = async () => {
    try {
      setLocalError("");

      // Get the correct session ID whether it's a quiz or survey session
      const sessionId = sessionData?.sessionId || sessionData?._id;
      if (!sessionId) {
        setLocalError("Session ID is required");
        return;
      }

      if (selectedUsers.length === 0) {
        setLocalError("Please select at least one user to invite");
        return;
      }

      const notificationData = {
        type: "invitation",
        message: `You've been invited to join the session!`,
        users: selectedUsers.map((user) => user._id),
        sessionId: sessionId
      };

      await createNotification(notificationData);

      // Call the parent onInvite function with selected users
      onInvite?.(selectedUsers);

      // Reset and close modal
      setSelectedUsers([]);
      setSearchQuery("");
      onClose();
    } catch (error) {
      setLocalError(error.message || "Failed to send invitations");
      console.error("Error sending invitations:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invite Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {localError || error}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto mb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.some((u) => u._id === user._id)
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "border-2 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedUsers.length} users selected
          </div>
          <div className="space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={selectedUsers.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedUsers.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Invite Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
// import React, { useState, useEffect } from "react";
// import { Search, X } from "lucide-react";
// import { useAuthContext } from "../context/AuthContext";
// import { useNotificationContext } from "../context/notificationContext";

// const InviteModal = ({ isOpen, onClose, sessionData, onInvite }) => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [localError, setLocalError] = useState("");

//   const {
//     user: currentUser,
//     listUsers,
//     users,
//     loading,
//     error,
//   } = useAuthContext();
//   const { createNotification } = useNotificationContext();

//   useEffect(() => {
//     if (isOpen) {
//       console.log("Modal opened, fetching users");
//       setLocalError("");
//       setSearchQuery("");
//       setSelectedUsers([]);
//       listUsers();
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (users) {
//       const filtered = users
//         .filter((user) => user._id !== currentUser?._id)
//         .filter(
//           (user) =>
//             user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             user.email?.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//       setFilteredUsers(filtered);
//     }
//   }, [users, searchQuery, currentUser]);

//   const handleUserSelect = (user) => {
//     setSelectedUsers((prev) => {
//       const isSelected = prev.some((u) => u._id === user._id);
//       if (isSelected) {
//         return prev.filter((u) => u._id !== user._id);
//       }
//       return [...prev, user];
//     });
//   };

//   const createNotificationData = () => {
//     // Determine if this is a quiz or survey session based on the joinCode property
//     const isSurvey = 'surveyJoinCode' in sessionData;
    
//     // Get the correct session ID and join code based on session type
//     const sessionId = sessionData?.sessionId || sessionData?._id;
//     const joinCode = isSurvey ? sessionData.surveyJoinCode : sessionData.joinCode;
//     const notificationType = isSurvey ? 'survey_invitation' : 'invitation';
    
//     return {
//       type: notificationType,
//       message: `You've been invited to join the ${isSurvey ? 'survey' : 'quiz'} session!`,
//       users: selectedUsers.map(user => user._id),
//       sessionId: sessionId,
//       sessionDetails: {
//         joinCode,
//         qrCodeUrl: isSurvey ? sessionData.surveyQrCodeImageUrl : sessionData.qrCodeImageUrl,
//         title: isSurvey 
//           ? sessionData.surveyQuiz?.title 
//           : (sessionData.quiz?.title || 'Session')
//       }
//     };
//   };

//   const validateSessionData = () => {
//     const sessionId = sessionData?.sessionId || sessionData?._id;
//     if (!sessionId) {
//       throw new Error('Invalid session data: Missing session ID');
//     }

//     const joinCode = 'surveyJoinCode' in sessionData 
//       ? sessionData.surveyJoinCode 
//       : sessionData.joinCode;
//     if (!joinCode) {
//       throw new Error('Invalid session data: Missing join code');
//     }

//     return true;
//   };

//   const handleInvite = async () => {
//     try {
//       setLocalError("");
  
//       // Validate session data
//       validateSessionData();
  
//       if (selectedUsers.length === 0) {
//         setLocalError("Please select at least one user to invite");
//         return;
//       }
  
//       // Create notification data
//       const notificationData = createNotificationData();
//       console.log("Sending notification data:", notificationData);
  
//       // Send notification
//       await createNotification(notificationData);
  
//       console.log(`Successfully sent ${notificationData.type} notifications to ${selectedUsers.length} users`);
  
//       // Call parent onInvite function
//       onInvite?.(selectedUsers);
  
//       // Reset and close modal
//       setSelectedUsers([]);
//       setSearchQuery("");
//       onClose();
//     } catch (error) {
//       const errorMessage = error.message || "Failed to send invitations";
//       setLocalError(errorMessage);
//       console.error("Error sending invitations:", error);
//     }
//   };
  

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold">
//             Invite Users to {sessionData?.surveyJoinCode ? 'Survey' : 'Quiz'}
//           </h2>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Error Message */}
//         {(localError || error) && (
//           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
//             {localError || error}
//           </div>
//         )}

//         <div className="mb-6">
//           <div className="relative">
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <Search
//               className="absolute left-3 top-2.5 text-gray-400"
//               size={20}
//             />
//           </div>
//         </div>

//         <div className="max-h-96 overflow-y-auto mb-6">
//           {loading ? (
//             <div className="flex justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {filteredUsers.map((user) => (
//                 <div
//                   key={user._id}
//                   onClick={() => handleUserSelect(user)}
//                   className={`p-4 rounded-lg cursor-pointer transition-colors ${
//                     selectedUsers.some((u) => u._id === user._id)
//                       ? "bg-blue-50 border-2 border-blue-500"
//                       : "border-2 border-gray-200 hover:border-blue-300"
//                   }`}
//                 >
//                   <div className="flex items-center space-x-3">
//                     <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
//                       <span className="text-white font-semibold">
//                         {user.username[0].toUpperCase()}
//                       </span>
//                     </div>
//                     <div>
//                       <div className="font-medium">{user.username}</div>
//                       <div className="text-sm text-gray-500">{user.email}</div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               {filteredUsers.length === 0 && (
//                 <div className="col-span-2 text-center py-8 text-gray-500">
//                   No users found
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <div className="flex justify-between items-center">
//           <div className="text-sm text-gray-600">
//             {selectedUsers.length} users selected
//           </div>
//           <div className="space-x-4">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleInvite}
//               sessionData={sessionData}
//               disabled={selectedUsers.length === 0}
//               className={`px-4 py-2 rounded-lg transition-colors ${
//                 selectedUsers.length === 0
//                   ? "bg-gray-300 cursor-not-allowed"
//                   : "bg-blue-500 hover:bg-blue-600 text-white"
//               }`}
//             >
//               Invite Selected
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InviteModal;