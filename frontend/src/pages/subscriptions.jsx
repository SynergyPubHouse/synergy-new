import { motion } from "framer-motion";
import { useAuth } from "../App"; // Assuming you have an Auth context

function MySubscriptions() {
  const { user } = useAuth(); // Fetch user details from Auth context

  // Mock subscription data (replace with actual data from your backend)
  const subscriptionData = {
    plan: "Premium",
    status: "Active",
    renewalDate: "January 1, 2024",
    billingHistory: [
      { id: 1, date: "2023-10-01", amount: "$49.99", status: "Paid" },
      { id: 2, date: "2023-09-01", amount: "$49.99", status: "Paid" },
      { id: 3, date: "2023-08-01", amount: "$49.99", status: "Paid" },
    ],
  };

  return (
    <div className="bg-[#f8fafc] text-[#1a365d] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-64 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-20 text-4xl md:text-6xl font-extrabold text-[#496580] font-serif tracking-wide drop-shadow-lg"
        >
          My Subscriptions
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
        >
          Manage your subscription plans and billing details.
        </motion.p>
      </section>

      {/* Subscription Details Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="mt-10 container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#496580] mb-8">Subscription Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Plan */}
            <div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Current Plan</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#496580]"><strong>Plan:</strong> {subscriptionData.plan}</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Status:</strong> {subscriptionData.status}</p>
                </div>
                <div>
                  <p className="text-[#496580]"><strong>Renewal Date:</strong> {subscriptionData.renewalDate}</p>
                </div>
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Upgrade Plan
              </button>
              <button className="mt-4 ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Cancel Subscription
              </button>
            </div>

            {/* Billing History */}
            <div className="p-6 bg-[#f8fafc] rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Billing History</h3>
              <div className="space-y-4">
                {subscriptionData.billingHistory.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
                    <p className="text-[#496580]"><strong>Date:</strong> {bill.date}</p>
                    <p className="text-[#496580]"><strong>Amount:</strong> {bill.amount}</p>
                    <p className="text-[#496580]"><strong>Status:</strong> {bill.status}</p>
                  </div>
                ))}
              </div>
              <button className="mt-6 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Available Plans Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-[#f8fafc]"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#496580] mb-8">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Basic Plan</h3>
              <p className="text-[#496580] mb-4">Access to essential features for individual researchers.</p>
              <p className="text-[#496580] mb-4"><strong>Price:</strong> $19.99/month</p>
              <button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Choose Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Premium Plan</h3>
              <p className="text-[#496580] mb-4">Advanced features for research teams and institutions.</p>
              <p className="text-[#496580] mb-4"><strong>Price:</strong> $49.99/month</p>
              <button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Choose Plan
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold text-[#496580] mb-4">Enterprise Plan</h3>
              <p className="text-[#496580] mb-4">Custom solutions for large organizations.</p>
              <p className="text-[#496580] mb-4"><strong>Price:</strong> Contact Us</p>
              <button className="mt-4 px-4 py-2 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Contact Sales
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
        className="py-20 bg-white text-center"
      >
        <h2 className="text-3xl font-bold text-[#496580]">Need Help?</h2>
        <p className="mt-4 text-lg text-[#496580]">
          Contact our support team for assistance with your subscription.
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

export default MySubscriptions;