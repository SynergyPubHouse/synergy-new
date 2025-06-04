import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const BASE = '/journal/Journal-of-Intelligent-Computing-Systems';

function TermsOfService() {
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
          Terms of Service
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
        >
          By using PaperSphere, you agree to comply with and be bound by the following terms and conditions.
        </motion.p>
      </section>

      {/* Terms Content Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#496580] mb-8">1. Acceptance of Terms</h2>
          <p className="text-lg text-[#496580] mb-6">
            By accessing or using the PaperSphere platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">2. User Responsibilities</h2>
          <p className="text-lg text-[#496580] mb-6">
            As a user of PaperSphere, you agree to:
          </p>
          <ul className="list-disc list-inside text-lg text-[#496580] mb-6">
            <li>Provide accurate and complete information during registration.</li>
            <li>Maintain the confidentiality of your account credentials.</li>
            <li>Use the platform only for lawful purposes.</li>
            <li>Not engage in any activity that disrupts or interferes with the platform's functionality.</li>
          </ul>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">3. Intellectual Property</h2>
          <p className="text-lg text-[#496580] mb-6">
            All content on PaperSphere, including text, graphics, logos, and software, is the property of PaperSphere or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">4. Privacy Policy</h2>
          <p className="text-lg text-[#496580] mb-6">
            Your use of PaperSphere is also governed by our{" "}
            <Link to={`${BASE}/privacy`} className="text-[#496580] hover:underline font-semibold">
              Privacy Policy
            </Link>
            , which outlines how we collect, use, and protect your personal information.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">5. Limitation of Liability</h2>
          <p className="text-lg text-[#496580] mb-6">
            PaperSphere shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. We do not guarantee the accuracy or completeness of any content on the platform.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">6. Termination</h2>
          <p className="text-lg text-[#496580] mb-6">
            PaperSphere reserves the right to terminate or suspend your account at any time, without notice, for conduct that violates these terms or is harmful to other users or the platform.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">7. Changes to Terms</h2>
          <p className="text-lg text-[#496580] mb-6">
            We may update these Terms of Service from time to time. Any changes will be posted on this page, and your continued use of the platform constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">8. Governing Law</h2>
          <p className="text-lg text-[#496580] mb-6">
            These Terms of Service are governed by the laws of the State of California, USA. Any disputes arising from your use of PaperSphere shall be resolved in the courts of California.
          </p>

          <h2 className="text-3xl font-bold text-[#496580] mb-8">9. Contact Us</h2>
          <p className="text-lg text-[#496580] mb-6">
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:support@papersphere.com" className="text-[#496580] hover:underline font-semibold">
              support@papersphere.com
            </a>
            .
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default TermsOfService;