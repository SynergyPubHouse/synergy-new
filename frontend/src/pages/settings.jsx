import React, { useState } from "react";
import { motion } from "framer-motion";

function Settings() {
  // State for UI/UX settings
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("medium");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  return (
    <div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-64 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-16 text-4xl md:text-6xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg"
        >
          UI/UX Settings
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
        >
          Customize your experience on Synergy World Press to suit your preferences.
        </motion.p>
      </section>

      {/* UI/UX Settings Sections */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          {/* Theme Settings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#496580] mb-8">Theme Settings</h2>
            <div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Select Theme</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="dark-theme"
                    name="theme"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={() => setTheme("dark")}
                    className="mr-2"
                  />
                  <label htmlFor="dark-theme" className="text-[#496580]">Dark Theme</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="light-theme"
                    name="theme"
                    value="light"
                    checked={theme === "light"}
                    onChange={() => setTheme("light")}
                    className="mr-2"
                  />
                  <label htmlFor="light-theme" className="text-[#496580]">Light Theme</label>
                </div>
              </div>
              <button
                onClick={() => alert("Theme updated successfully!")}
                className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Save Theme
              </button>
            </div>
          </div>

          {/* Font Size Settings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#496580] mb-8">Font Size Settings</h2>
            <div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Adjust Font Size</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="small-font"
                    name="font-size"
                    value="small"
                    checked={fontSize === "small"}
                    onChange={() => setFontSize("small")}
                    className="mr-2"
                  />
                  <label htmlFor="small-font" className="text-[#496580]">Small</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="medium-font"
                    name="font-size"
                    value="medium"
                    checked={fontSize === "medium"}
                    onChange={() => setFontSize("medium")}
                    className="mr-2"
                  />
                  <label htmlFor="medium-font" className="text-[#496580]">Medium</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="large-font"
                    name="font-size"
                    value="large"
                    checked={fontSize === "large"}
                    onChange={() => setFontSize("large")}
                    className="mr-2"
                  />
                  <label htmlFor="large-font" className="text-[#496580]">Large</label>
                </div>
              </div>
              <button
                onClick={() => alert("Font size updated successfully!")}
                className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Save Font Size
              </button>
            </div>
          </div>

          {/* Animation Settings */}
          <div>
            <h2 className="text-3xl font-bold text-[#496580] mb-8">Animation Settings</h2>
            <div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Enable/Disable Animations</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="animations-enabled"
                    checked={animationsEnabled}
                    onChange={() => setAnimationsEnabled(!animationsEnabled)}
                    className="mr-2"
                  />
                  <label htmlFor="animations-enabled" className="text-[#496580]">Enable Animations</label>
                </div>
              </div>
              <button
                onClick={() => alert("Animation settings updated successfully!")}
                className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Save Animation Settings
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
          Contact our support team for assistance with your settings.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href="mailto:support@synergyworldpress.com"
            className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Contact Support
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default Settings;