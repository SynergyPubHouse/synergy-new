import { motion } from "framer-motion";
import { useAuth } from "../App"; // Assuming you have an Auth context
import { FaUserCircle, FaCamera } from "react-icons/fa";

function MyAccount() {
  const { user } = useAuth(); // Fetch user details from Auth context

  // Function to handle profile picture change
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Update the user's profile picture (you can replace this with your backend logic)
        alert("Profile picture updated successfully!");
        console.log("New profile picture:", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#f9f9f9] text-[#212121] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-64 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-20 text-4xl md:text-6xl font-extrabold text-[#00796b] tracking-wide drop-shadow-sm"
        >
          My Account
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#212121] max-w-2xl"
        >
          Manage your account details, subscriptions, and preferences.
        </motion.p>
      </section>

      {/* Profile Picture Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-12 bg-white text-center"
      >
        <div className="relative inline-block">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-[#00acc1]"
            />
          ) : (
            <FaUserCircle className="w-32 h-32 text-[#00acc1] rounded-full border-4 border-[#00acc1]" />
          )}
          <label
            htmlFor="profile-picture"
            className="absolute bottom-0 right-0 bg-[#00796b] p-2 rounded-full cursor-pointer hover:bg-[#00acc1] transition-colors"
          >
            <FaCamera className="w-6 h-6 text-white" />
            <input
              type="file"
              id="profile-picture"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
          </label>
        </div>
      </motion.section>

      {/* Account Details Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-[#f9f9f9]"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#00796b] mb-8">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-[#e0e0e0]">
              <h3 className="text-xl font-semibold text-[#00796b] mb-4">Personal Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#212121]"><strong>Name:</strong> {user?.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[#212121]"><strong>Email:</strong> {user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[#212121]"><strong>Role:</strong> {user?.EditorRole === "yes" ? "Editor" : "Author"}</p>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
                Edit Profile
              </button>
            </div>

            {/* Subscription Information */}
            <div className="p-6 bg-white rounded-xl shadow-md border border-[#e0e0e0]">
              <h3 className="text-xl font-semibold text-[#00796b] mb-4">Subscription Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#212121]"><strong>Plan:</strong> Premium</p>
                </div>
                <div>
                  <p className="text-[#212121]"><strong>Status:</strong> Active</p>
                </div>
                <div>
                  <p className="text-[#212121]"><strong>Renewal Date:</strong> January 1, 2024</p>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Preferences Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#00796b] mb-8">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Notification Preferences */}
            <div className="p-6 bg-[#e0f7fa] rounded-xl shadow-md border border-[#e0e0e0]">
              <h3 className="text-xl font-semibold text-[#00796b] mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="email-notifications" className="mr-2" defaultChecked />
                  <label htmlFor="email-notifications" className="text-[#212121]">Email Notifications</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="sms-notifications" className="mr-2" />
                  <label htmlFor="sms-notifications" className="text-[#212121]">SMS Notifications</label>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
                Save Preferences
              </button>
            </div>

            {/* Privacy Preferences */}
            <div className="p-6 bg-[#e0f7fa] rounded-xl shadow-md border border-[#e0e0e0]">
              <h3 className="text-xl font-semibold text-[#00796b] mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="public-profile" className="mr-2" />
                  <label htmlFor="public-profile" className="text-[#212121]">Make Profile Public</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="data-sharing" className="mr-2" defaultChecked />
                  <label htmlFor="data-sharing" className="text-[#212121]">Allow Data Sharing for Research</label>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-[#f9f9f9] text-center"
      >
        <h2 className="text-3xl font-bold text-[#00796b]">Need Help?</h2>
        <p className="mt-4 text-lg text-[#212121]">
          Contact our support team for assistance with your account.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href="mailto:support@synergyworldpress.com"
            className="px-8 py-4 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold text-lg rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
          >
            Contact Support
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default MyAccount;




// import { motion } from "framer-motion";
// import { useAuth } from "../App"; // Assuming you have an Auth context
// import { FaUserCircle, FaCamera, FaEdit, FaCog, FaBell, FaShieldAlt, FaQuestionCircle } from "react-icons/fa";

// function MyAccount() {
//   const { user } = useAuth(); // Fetch user details from Auth context

//   const handleProfilePictureChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         // Update the user's profile picture
//         alert("Profile picture updated successfully!");
//         console.log("New profile picture:", e.target.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="bg-white shadow-sm">
//         <div className="container mx-auto px-4 py-6">
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="flex justify-between items-center"
//           >
//             <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
//             <div className="flex items-center space-x-4">
//               <button className="text-gray-600 hover:text-gray-900">
//                 <FaQuestionCircle className="w-5 h-5" />
//               </button>
//             </div>
//           </motion.div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col md:flex-row gap-6">
//           {/* Sidebar */}
//           <div className="w-full md:w-64 flex-shrink-0">
//             <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//               <div className="relative mx-auto w-24 h-24 mb-4">
//                 {user?.photoURL ? (
//                   <img
//                     src={user.photoURL}
//                     alt="Profile"
//                     className="w-full h-full rounded-full object-cover border-2 border-teal-500"
//                   />
//                 ) : (
//                   <FaUserCircle className="w-full h-full text-gray-400" />
//                 )}
//                 <label
//                   htmlFor="profile-picture"
//                   className="absolute bottom-0 right-0 bg-teal-500 p-1.5 rounded-full cursor-pointer hover:bg-teal-600 transition-colors"
//                 >
//                   <FaCamera className="w-4 h-4 text-white" />
//                   <input
//                     type="file"
//                     id="profile-picture"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={handleProfilePictureChange}
//                   />
//                 </label>
//               </div>
//               <h2 className="text-center font-semibold text-gray-800">{user?.name || "User"}</h2>
//               <p className="text-center text-sm text-gray-500">{user?.email || "user@example.com"}</p>
//             </div>

//             <nav className="bg-white rounded-lg shadow-sm p-2">
//               <ul className="space-y-1">
//                 <li>
//                   <a href="#profile" className="flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium">
//                     <FaUserCircle className="w-5 h-5 mr-3 text-teal-500" />
//                     Profile
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#subscription" className="flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100">
//                     <FaCog className="w-5 h-5 mr-3 text-teal-500" />
//                     Subscription
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#notifications" className="flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100">
//                     <FaBell className="w-5 h-5 mr-3 text-teal-500" />
//                     Notifications
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#privacy" className="flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100">
//                     <FaShieldAlt className="w-5 h-5 mr-3 text-teal-500" />
//                     Privacy
//                   </a>
//                 </li>
//               </ul>
//             </nav>
//           </div>

//           {/* Main Panel */}
//           <div className="flex-1">
//             {/* Profile Section */}
//             <motion.section
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//               className="bg-white rounded-lg shadow-sm p-6 mb-6"
//               id="profile"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
//                 <button className="flex items-center text-sm text-teal-600 hover:text-teal-700">
//                   <FaEdit className="w-4 h-4 mr-1" />
//                   Edit
//                 </button>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
//                   <p className="text-gray-800">{user?.name || "Not provided"}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
//                   <p className="text-gray-800">{user?.email || "Not provided"}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Account Role</label>
//                   <p className="text-gray-800">{user?.EditorRole === "yes" ? "Editor" : "Author"}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
//                   <p className="text-gray-800">January 2023</p>
//                 </div>
//               </div>
//             </motion.section>

//             {/* Subscription Section */}
//             <motion.section
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: 0.1 }}
//               className="bg-white rounded-lg shadow-sm p-6 mb-6"
//               id="subscription"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-semibold text-gray-800">Subscription</h2>
//                 <button className="text-sm text-teal-600 hover:text-teal-700">Manage</button>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Plan</label>
//                   <p className="text-gray-800">Premium</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
//                   <p className="text-green-600 font-medium">Active</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Renewal Date</label>
//                   <p className="text-gray-800">January 1, 2024</p>
//                 </div>
//               </div>
//             </motion.section>

//             {/* Notifications Section */}
//             <motion.section
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: 0.2 }}
//               className="bg-white rounded-lg shadow-sm p-6 mb-6"
//               id="notifications"
//             >
//               <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700 mb-1">Email Notifications</label>
//                     <p className="text-xs text-gray-500">Receive important updates via email</p>
//                   </div>
//                   <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                     <input 
//                       type="checkbox" 
//                       id="email-notifications" 
//                       defaultChecked
//                       className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
//                     />
//                     <label 
//                       htmlFor="email-notifications" 
//                       className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
//                     ></label>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label htmlFor="sms-notifications" className="block text-sm font-medium text-gray-700 mb-1">SMS Notifications</label>
//                     <p className="text-xs text-gray-500">Get text message alerts</p>
//                   </div>
//                   <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                     <input 
//                       type="checkbox" 
//                       id="sms-notifications" 
//                       className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
//                     />
//                     <label 
//                       htmlFor="sms-notifications" 
//                       className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
//                     ></label>
//                   </div>
//                 </div>
//               </div>
//             </motion.section>

//             {/* Privacy Section */}
//             <motion.section
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: 0.3 }}
//               className="bg-white rounded-lg shadow-sm p-6"
//               id="privacy"
//             >
//               <h2 className="text-xl font-semibold text-gray-800 mb-6">Privacy Settings</h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label htmlFor="public-profile" className="block text-sm font-medium text-gray-700 mb-1">Public Profile</label>
//                     <p className="text-xs text-gray-500">Make your profile visible to others</p>
//                   </div>
//                   <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                     <input 
//                       type="checkbox" 
//                       id="public-profile" 
//                       className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
//                     />
//                     <label 
//                       htmlFor="public-profile" 
//                       className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
//                     ></label>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <label htmlFor="data-sharing" className="block text-sm font-medium text-gray-700 mb-1">Data Sharing</label>
//                     <p className="text-xs text-gray-500">Allow data to be used for research</p>
//                   </div>
//                   <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                     <input 
//                       type="checkbox" 
//                       id="data-sharing" 
//                       defaultChecked
//                       className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
//                     />
//                     <label 
//                       htmlFor="data-sharing" 
//                       className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
//                     ></label>
//                   </div>
//                 </div>
//               </div>
//             </motion.section>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MyAccount;