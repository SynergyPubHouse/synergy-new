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
    <div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-64 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg mt-20"
        >
          My Account
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
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
              className="w-32 h-32 rounded-full border-4 border-[#496580]"
            />
          ) : (
            <FaUserCircle className="w-32 h-32 text-[#496580] rounded-full border-4 border-[#496580]" />
          )}
          <label
            htmlFor="profile-picture"
            className="absolute bottom-0 right-0 bg-[#496580] p-2 rounded-full cursor-pointer hover:bg-[#3a5269] transition-colors"
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
        className="py-20 bg-[#f8fafc]"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#496580] mb-8">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Personal Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#496580]"><strong>Name:</strong> {user?.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Email:</strong> {user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Role:</strong> {user?.EditorRole === "yes" ? "Editor" : "Author"}</p>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Edit Profile
              </button>
            </div>

            {/* Subscription Information */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Subscription Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#496580]"><strong>Plan:</strong> Premium</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Status:</strong> Active</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Renewal Date:</strong> January 1, 2024</p>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
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
          <h2 className="text-3xl font-bold text-[#496580] mb-8">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Notification Preferences */}
            <div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="email-notifications" className="mr-2" defaultChecked />
                  <label htmlFor="email-notifications" className="text-[#496580]">Email Notifications</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="sms-notifications" className="mr-2" />
                  <label htmlFor="sms-notifications" className="text-[#496580]">SMS Notifications</label>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Save Preferences
              </button>
            </div>

            {/* Privacy Preferences */}
            <div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" id="public-profile" className="mr-2" />
                  <label htmlFor="public-profile" className="text-[#496580]">Make Profile Public</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="data-sharing" className="mr-2" defaultChecked />
                  <label htmlFor="data-sharing" className="text-[#496580]">Allow Data Sharing for Research</label>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
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
        className="py-20 bg-[#f8fafc] text-center"
      >
        <h2 className="text-3xl font-bold text-[#496580]">Need Help?</h2>
        <p className="mt-4 text-lg text-[#496580]">
          Contact our support team for assistance with your account.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href="mailto:support@papersphere.com"
            className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Contact Support
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default MyAccount;