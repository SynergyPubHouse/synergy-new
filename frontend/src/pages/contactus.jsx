import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

function ContactUs() {
  return (
    <div className="bg-[#f9f9f9] text-[#212121] min-h-screen">
      {/* Hero Section */}
      <section className="mt-24 flex flex-col items-center justify-center py-16 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-extrabold text-[#00796b] tracking-wide"
        >
          Contact Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-lg text-[#212121] max-w-2xl"
        >
          Have questions or need assistance? We're here to help! Reach out via the form or our contact details.
        </motion.p>
      </section>

      {/* Contact Information Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-10 bg-white"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#00796b] text-center mb-6">Get in Touch</h2>
          <p className="text-lg text-[#212121] text-center max-w-3xl mx-auto mb-8">
            We'd love to hear from you. Here's how you can reach us:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Address */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-[#e0f7fa] rounded-xl shadow-sm border border-[#e0e0e0] text-center"
            >
              <FaMapMarkerAlt className="text-[#00acc1] text-2xl mx-auto" />
              <h3 className="text-lg font-semibold text-[#00796b] mt-3">Our Office</h3>
              <p className="mt-2 text-[#212121]">
                S4, 904, Harmony Homes, Panipat, Haryana, 132103<br />INDIA
              </p>
            </motion.div>

            {/* Phone */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-[#e0f7fa] rounded-xl shadow-sm border border-[#e0e0e0] text-center"
            >
              <FaPhone className="text-[#00acc1] text-2xl mx-auto" />
              <h3 className="text-lg font-semibold text-[#00796b] mt-3">Call Us</h3>
              <p className="mt-2 text-[#212121]">
                +91  8708951544<br />
                Mon–Fri, 9am–4pm
              </p>
            </motion.div>

            {/* Email */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-[#e0f7fa] rounded-xl shadow-sm border border-[#e0e0e0] text-center"
            >
              <FaEnvelope className="text-[#00acc1] text-2xl mx-auto" />
              <h3 className="text-lg font-semibold text-[#00796b] mt-3">Email Us</h3>
              <p className="mt-2 text-[#212121]">
                synergyworldpress@gmail.com<br />
                Response within 24 hours
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-10 bg-[#f9f9f9]"
      >
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-[#00796b] text-center mb-6">Send Us a Message</h2>
          <p className="text-lg text-[#212121] text-center mb-8">
            Fill out the form below, and we'll get back to you as soon as possible.
          </p>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="p-3 bg-white rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00acc1]"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                className="p-3 bg-white rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00acc1]"
                required
              />
            </div>
            <textarea
              placeholder="Your Message"
              rows="4"
              className="w-full p-3 bg-white rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00acc1]"
              required
            />
            <div className="text-center">
              <button
                type="submit"
                className="mt-4 px-6 py-3 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </motion.section>

      {/* Map Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-10 bg-white"
      >
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-[#00796b] text-center mb-6">Our Location</h2>
          <p className="text-lg text-[#212121] text-center mb-6">
            Find us on the map below:
          </p>
          <div className="overflow-hidden rounded-xl shadow-sm border border-[#e0e0e0]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.8354345093747!2d144.95373531531664!3d-37.816279742021665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a32f8c1f5!2s123%20Research%20Ave%2C%20Innovation%20City%20VIC%203000%2C%20Australia!5e0!3m2!1sen!2sus!4v1633033226785!5m2!1sen!2sus"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default ContactUs;
