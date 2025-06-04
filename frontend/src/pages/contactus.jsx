import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";

function ContactUs() {
  return (
    <div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-screen text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg"
        >
          Contact Us
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
        >
          Have questions or need assistance? We're here to help! Reach out to us via the form below or use our contact details.
        </motion.p>
      </section>

      {/* Contact Information Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white text-center"
      >
        <h2 className="text-3xl font-bold text-[#496580]">Get in Touch</h2>
        <p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
          We'd love to hear from you. Here's how you can reach us:
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20">
          {/* Address */}
          <div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
            <FaMapMarkerAlt className="text-[#496580] text-3xl mx-auto" />
            <h3 className="text-xl font-semibold text-[#496580] mt-4">Our Office</h3>
            <p className="mt-2 text-[#496580]">
              Chandigarh University, <br />
              Mohali INDIA
            </p>
          </div>

          {/* Phone */}
          <div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
            <FaPhone className="text-[#496580] text-3xl mx-auto" />
            <h3 className="text-xl font-semibold text-[#496580] mt-4">Call Us</h3>
            <p className="mt-2 text-[#496580]">
              +91 62840012XX <br />
              Mon - Fri, 9:00 AM - 4:00 PM
            </p>
          </div>

          {/* Email */}
          <div className="p-6 bg-[#f0f9ff] rounded-lg shadow-md">
            <FaEnvelope className="text-[#496580] text-3xl mx-auto" />
            <h3 className="text-xl font-semibold text-[#496580] mt-4">Email Us</h3>
            <p className="mt-2 text-[#496580]">
              support@papersphere.com <br />
              We respond within 24 hours.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-[#f8fafc] text-center"
      >
        <h2 className="text-3xl font-bold text-[#496580]">Send Us a Message</h2>
        <p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
          Fill out the form below, and we'll get back to you as soon as possible.
        </p>
        <form className="mt-8 max-w-2xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Your Name"
              className="p-3 bg-white rounded-lg text-[#496580] focus:outline-none focus:ring-2 focus:ring-[#496580] border border-[#d1d5db]"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              className="p-3 bg-white rounded-lg text-[#496580] focus:outline-none focus:ring-2 focus:ring-[#496580] border border-[#d1d5db]"
              required
            />
          </div>
          <textarea
            placeholder="Your Message"
            rows="5"
            className="w-full p-3 mt-6 bg-white rounded-lg text-[#496580] focus:outline-none focus:ring-2 focus:ring-[#496580] border border-[#d1d5db]"
            required
          />
          <button
            type="submit"
            className="mt-6 px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Send Message
          </button>
        </form>
      </motion.section>

      {/* Map Section (Optional) */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white text-center"
      >
        <h2 className="text-3xl font-bold text-[#496580]">Our Location</h2>
        <p className="mt-4 text-lg text-[#496580] max-w-3xl mx-auto">
          Find us on the map below:
        </p>
        <div className="mt-8 px-6 md:px-20">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.8354345093747!2d144.95373531531664!3d-37.816279742021665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a32f8c1f5!2s123%20Research%20Ave%2C%20Innovation%20City%20VIC%203000%2C%20Australia!5e0!3m2!1sen!2sus!4v1633033226785!5m2!1sen!2sus"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            className="rounded-lg shadow-lg border border-[#d1d5db]"
          ></iframe>
        </div>
      </motion.section>
    </div>
  );
}

export default ContactUs;