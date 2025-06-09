import { motion } from "framer-motion";

function AboutUs() {
  const teamMembers = [
    {
      name: "Dr. Rakesh Kumar",
      image: "https://placehold.co/200x200",
      education: "Ph.D. in Computer Science, Stanford University",
      achievements: [
        "Published over 50 research papers in top-tier journals.",
        "Recipient of the prestigious ACM Distinguished Scientist Award.",
        "Advisor to multiple startups in the tech industry.",
      ],
      thoughts:
        "I believe that technology has the power to transform the world. At Synergy World Press, we are committed to creating a platform that empowers researchers and accelerates the pace of innovation.",
    },
    {
      name: "Dr. Meenu Gupta",
      image: "https://placehold.co/200x200",
      education: "Ph.D. in Biotechnology, Harvard University",
      achievements: [
        "Published over 40 research papers in high-impact journals.",
        "Recipient of the National Science Foundation Career Award.",
        "Keynote speaker at international conferences on biotechnology.",
      ],
      thoughts:
        "Research is the foundation of progress. At Synergy World Press, we aim to create a platform that bridges the gap between researchers and the global community, fostering collaboration and innovation.",
    },
  ];

  return (
    <div className="bg-[#f9f9f9] text-[#212121] min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center h-64 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-16 text-4xl md:text-6xl font-extrabold text-[#00796b] tracking-wide drop-shadow-sm"
        >
          About Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-4 text-lg text-[#212121] max-w-2xl"
        >
          Learn more about our mission, vision, and the brilliant minds behind Synergy World Press.
        </motion.p>
      </section>

      {/* Goals Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#00796b] mb-8">Our Goals</h2>
          <div className="space-y-6">
            <p className="text-lg text-[#212121]">
              At Synergy World Press, our mission is to revolutionize the way research is published and shared. We aim to create a platform that empowers researchers, fosters collaboration, and accelerates the dissemination of knowledge.
            </p>
            <p className="text-lg text-[#212121]">
              Our goals include:
            </p>
            <ul className="list-disc list-inside text-lg text-[#212121] space-y-4">
              <li>Providing a seamless and user-friendly platform for researchers to publish their work.</li>
              <li>Ensuring rigorous peer review to maintain the highest standards of academic integrity.</li>
              <li>Promoting open access to research to make knowledge accessible to all.</li>
              <li>Encouraging interdisciplinary collaboration to solve global challenges.</li>
              <li>Leveraging technology to streamline the research publication process.</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Team Members Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-20 bg-[#f9f9f9]"
      >
        <div className="container mx-auto px-6 md:px-20">
          <h2 className="text-3xl font-bold text-[#00796b] mb-8 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="p-6 bg-white rounded-xl shadow-md border border-[#e0e0e0]"
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-48 h-48 rounded-full border-4 border-[#00acc1] mb-6"
                  />
                  <h3 className="text-2xl font-bold text-[#00796b]">{member.name}</h3>
                  <p className="text-lg text-[#212121] mt-2">{member.education}</p>
                  <div className="mt-4">
                    <h4 className="text-xl font-bold text-[#00796b]">Achievements</h4>
                    <ul className="list-disc list-inside text-lg text-[#212121] mt-2">
                      {member.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-xl font-bold text-[#00796b]">Thoughts</h4>
                    <p className="text-lg text-[#212121] mt-2">{member.thoughts}</p>
                  </div>
                </div>
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
        className="py-20 bg-white text-center"
      >
        <h2 className="text-3xl font-bold text-[#00796b]">Join Us in Our Mission</h2>
        <p className="mt-4 text-lg text-[#212121]">
          Are you passionate about research and innovation? Join us in making a difference.
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10"
        >
          <a
            href="/contact"
            className="px-8 py-4 bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold text-lg rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
          >
            Contact Us
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default AboutUs;
