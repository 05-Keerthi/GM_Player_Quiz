// import React from "react";
// import { User, Mail, Phone } from "lucide-react";

// const UserCard = ({
//   username,
//   email,
//   phoneNumber,
//   actionText = "View Profile",
//   onAction,
//   bgColor = "bg-indigo-600"
// }) => (
//   <div className={`relative p-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${bgColor} max-w-sm`}>
//     <div className="absolute top-3 right-3">
//       <User className="text-white/80" size={20} />
//     </div>
    
//     <div className="space-y-3">
//       <h3 className="text-lg font-bold text-white">{username}</h3>
      
//       <ul className="space-y-2 text-white/90 text-sm">
//         <li className="flex items-center space-x-2">
//           <Mail size={14} className="flex-shrink-0" />
//           <span className="break-all">{email}</span>
//         </li>
//         <li className="flex items-center space-x-2">
//           <Phone size={14} className="flex-shrink-0" />
//           <span>{phoneNumber}</span>
//         </li>
//       </ul>
      
//       <button
//         onClick={onAction}
//         className="w-full mt-2 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors text-sm"
//       >
//         {actionText}
//       </button>
//     </div>
//   </div>
// );

// export default UserCard;



import React from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const users = [
    {
      id: 1,
      name: "Yenny Rosales",
      email: "yenny@example.com",
      avatar: "/api/placeholder/32/32",
      role: "User"
    },
    {
      id: 2,
      name: "Lennart Nyqvist",
      email: "lennart@example.com",
      avatar: "/api/placeholder/32/32",
      role: "User"
    },
    {
      id: 3,
      name: "Tallen Dalton",
      email: "tallen@example.com",
      avatar: "/api/placeholder/32/32",
      role: "User"
    },
    {
      id: 4,
      name: "Anders Andersen",
      email: "anders@example.com",
      avatar: "/api/placeholder/32/32",
      role: "User"
    },
    {
      id: 5,
      name: "Armand Hyde",
      email: "armand@example.com",
      avatar: "/api/placeholder/32/32",
      role: "User"
    }
  ];

  const handleEdit = (userId) => {
    console.log('Edit user:', userId);
  };

  const handleDelete = (userId) => {
    console.log('Delete user:', userId);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm text-gray-500 mb-2">
          
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="flex gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search User"
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium">
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-8 pb-4">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="text-left pb-4 font-medium">Name</th>
              <th className="text-left pb-4 font-medium">User Role</th>
              <th className="text-right pb-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-4">
                  <input type="checkbox" className="rounded" />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(user.id)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-500">
          Displaying page 1 of 11
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50">First</button>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded bg-blue-50 text-blue-600 font-medium">1</button>
            <button className="w-8 h-8 rounded hover:bg-gray-50">10</button>
            <button className="w-8 h-8 rounded hover:bg-gray-50">11</button>
          </div>
          <button className="px-3 py-1 border rounded hover:bg-gray-50">Last</button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;