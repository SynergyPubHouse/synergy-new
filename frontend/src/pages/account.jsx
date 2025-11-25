import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../App";
import { FaUserCircle, FaCamera } from "react-icons/fa";
import { getUserRole, getUserFullName } from "../utils/roleUtils";
import axios from "axios";

function MyAccount() {
  const { user, login } = useAuth();
  const userRole = getUserRole(user);
  const userFullName = getUserFullName(user);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email:
      user?.email || user?.editor?.email || user?.reviewer?.email || "",
    username: user?.username || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      alert("You must be logged in to update your profile.");
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response?.data) {
        login({
          ...(user || {}),
          ...response.data,
        });
      }

      alert("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      const message =
        error?.response?.data?.message || "Failed to update profile. Please try again.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

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
              {!isEditing ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[#212121]"><strong>Name:</strong> {userFullName || `${formData.firstName} ${formData.lastName}`.trim() || user?.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[#212121]"><strong>Email:</strong> {formData.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[#212121]"><strong>Username:</strong> {formData.username || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[#212121]"><strong>Role:</strong> {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Not specified"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="mt-6 px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00796b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#212121] mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00796b]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00796b]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#212121] mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00796b]"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-[#00796b] hover:bg-[#00acc1] disabled:bg-[#80cbc4] text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#212121] font-semibold rounded-xl shadow-md transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
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




