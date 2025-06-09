import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
  return (
    <div className="bg-[#f9f9f9] text-[#212121] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-screen text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-extrabold text-[#00796b] font-serif tracking-wide drop-shadow-lg"
        >
          Privacy Policy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#212121] max-w-2xl"
        >
          Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
        </motion.p>
      </section>

      {/* Privacy Policy Content Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#00796b] mb-8">1. Information We Collect</h2>
          <p className="text-lg text-[#212121] mb-6">
            We collect the following types of information when you use Synergy World Press:
          </p>
          <ul className="list-disc list-inside text-lg text-[#212121] mb-6">
            <li><strong>Personal Information:</strong> Name, email address, and contact details provided during registration.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the platform, such as pages visited and features used.</li>
            <li><strong>Cookies:</strong> We use cookies to enhance your experience and analyze platform usage.</li>
          </ul>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">2. How We Use Your Information</h2>
          <p className="text-lg text-[#212121] mb-6">
            We use your information for the following purposes:
          </p>
          <ul className="list-disc list-inside text-lg text-[#212121] mb-6">
            <li>To provide and improve our services.</li>
            <li>To communicate with you about your account and platform updates.</li>
            <li>To analyze platform usage and optimize performance.</li>
            <li>To comply with legal obligations.</li>
          </ul>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">3. Data Sharing and Disclosure</h2>
          <p className="text-lg text-[#212121] mb-6">
            We do not sell or rent your personal information to third parties. However, we may share your information in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-lg text-[#212121] mb-6">
            <li>With service providers who assist us in operating the platform.</li>
            <li>When required by law or to protect our rights and safety.</li>
            <li>In connection with a business transfer, such as a merger or acquisition.</li>
          </ul>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">4. Data Security</h2>
          <p className="text-lg text-[#212121] mb-6">
            We implement industry-standard security measures to protect your information from unauthorized access, alteration, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">5. Your Rights</h2>
          <p className="text-lg text-[#212121] mb-6">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-lg text-[#212121] mb-6">
            <li>Access and update your personal information.</li>
            <li>Request deletion of your data, subject to legal obligations.</li>
            <li>Opt-out of receiving promotional communications.</li>
          </ul>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">6. Cookies</h2>
          <p className="text-lg text-[#212121] mb-6">
            We use cookies to enhance your experience on Synergy World Press. You can manage or disable cookies through your browser settings, but this may affect platform functionality.
          </p>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">7. Third-Party Links</h2>
          <p className="text-lg text-[#212121] mb-6">
            Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of these sites.
          </p>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">8. Changes to This Policy</h2>
          <p className="text-lg text-[#212121] mb-6">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page, and your continued use of the platform constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-3xl font-bold text-[#00796b] mb-8">9. Contact Us</h2>
          <p className="text-lg text-[#212121] mb-6">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@synergyworldpress.com" className="text-[#00796b] hover:underline font-semibold">support@synergyworldpress.com</a>.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default PrivacyPolicy;
