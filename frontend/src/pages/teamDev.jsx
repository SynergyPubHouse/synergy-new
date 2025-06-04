import { motion } from "framer-motion";

function TeamDevPage() {
  const teamMembers = [
    {
      name: "Harsahibjit Singh",
      role: "Lead Developer",
      image: "https://placehold.co/200x200",
      description: "Harsahibjit is the backbone of our development team, ensuring seamless functionality and innovation in every feature.",
    },
    {
      name: "Likhil N Maiya",
      role: "Full Stack Developer",
      image: "https://placehold.co/200x200",
      description: "Likhil brings creativity and precision to the frontend, crafting user-friendly and visually stunning interfaces.",
    },
    {
      name: "Anurag Mondal",
      role: "Backend Developer",
      image: "https://placehold.co/200x200",
      description: "Anurag powers the backend with robust and scalable solutions, ensuring the platform runs smoothly and efficiently.",
    },
  ];

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
          Our Team
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#496580] max-w-2xl"
        >
          Meet the talented individuals behind PaperSphere who are dedicated to making research publishing seamless and efficient.
        </motion.p>
      </section>

      {/* Team Members Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#496580] mb-8 text-center">The Developers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="p-6 bg-[#f8fafc] rounded-lg shadow-md text-center border border-[#e2e8f0]"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto border-4 border-[#496580]"
                />
                <h3 className="text-2xl font-bold text-[#496580] mt-4">{member.name}</h3>
                <p className="text-lg text-[#496580] mt-2">{member.role}</p>
                <p className="text-[#496580] mt-4">{member.description}</p>
              </motion.div>
            ))}
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
        <h2 className="text-3xl font-bold text-[#496580]">Join Our Team</h2>
        <p className="mt-4 text-lg text-[#496580]">
          Are you passionate about research and technology? We're always looking for talented individuals to join our team.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href="mailto:careers@papersphere.com"
            className="px-8 py-4 bg-[#496580] hover:bg-[#3a5269] text-white font-semibold text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Contact Us
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default TeamDevPage;