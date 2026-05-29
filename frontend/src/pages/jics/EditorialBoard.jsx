import React, { useState } from "react";

// Top Leadership Data with Biography
const topLeadership = {
  editorInChief: {
    name: "Dr. Meenu Gupta",
    affiliation: "Chandigarh University, Mohali, Punjab, 140413, India",
    designation: "Professor and Head – Conferences & Research Outreach",
    image: "/images/b12a986f-b157-4137-93fa-c6d5af52a98a.jfif",
    role: "Editor-in-Chief",
    biography: `Dr. Meenu Gupta is a distinguished academician, researcher, and innovation leader with over 18 years of teaching, research, and academic leadership experience in the field of Computer Science and Engineering. She currently serves as Professor and Head – Conferences & Research Outreach at Chandigarh University, Punjab, India, where she plays a pivotal role in strengthening research culture, global collaborations, funded projects, and high-impact scholarly output.

Dr. Gupta holds a Post-Doctoral Fellowship in Computer Science and Engineering from MIR Lab, USA, where her research focused on adversarial network-based regeneration of multimodal brain images for Alzheimer’s disease classification. She earned her Ph.D. in Computer Science and Engineering from Ansal University, Gurugram, with her doctoral research centered on real-world traffic accident data analysis using data mining techniques. Her academic credentials also include M.Tech in CSE, MBA (Finance), and B.Tech in Information Technology, reflecting her strong interdisciplinary foundation.

Her research interests span Artificial Intelligence, Machine Learning, Deep Learning, Data Mining, Medical Image Analysis, Social Network Analysis, Internet of Things (IoT), Cloud Computing, Big Data, and Blockchain. Dr. Gupta has made significant contributions to AI-driven healthcare, medical imaging, smart systems, and intelligent decision-support frameworks, particularly in areas such as Alzheimer’s disease diagnosis, cancer detection, PCOS management, traffic analytics, and IoT-enabled healthcare systems.

Dr. Gupta has an extensive publication record with numerous papers published in SCI, SCIE, ESCI, and Scopus-indexed journals, including reputed platforms such as IEEE Access, Applied Soft Computing, Multimedia Tools and Applications, Computers & Electrical Engineering, PLOS ONE, Endocrine, and Current Medical Imaging. She is also an active contributor to international conferences, serving as author, reviewer, session chair, and technical committee member. Her scholarly profile is well-established across Google Scholar, Scopus, Web of Science, ORCID, ResearchGate, Publons, IEEE Xplore, and SSRN.

A committed research mentor, Dr. Gupta has successfully supervised and co-supervised numerous Ph.D. and M.Tech scholars, guiding research across deep learning, medical image analysis, speech processing, satellite imaging, healthcare analytics, and intelligent systems. Many of her supervised works have resulted in high-quality journal publications, patents, and real-world applications.

Dr. Gupta is also a prolific innovator and inventor, with a remarkable portfolio of granted and published patents in domains such as AI-based healthcare devices, intelligent traffic systems, IoT-enabled safety solutions, smart wearables, energy-efficient systems, and smart infrastructure. Her innovation-driven approach emphasizes translational research and societal impact.

She has successfully led and contributed to industry-academia collaborative projects, including funded research projects with Samsung PRISM, where her teams received recognition for best project awards. Her leadership extends to organizing international conferences, workshops, faculty development programs, and research outreach initiatives, fostering strong engagement between academia, industry, and global research communities.

Dr. Gupta is a Senior Member of IEEE, a member of the Executive Committee of IEEE Delhi Section, and a Life Member of ISTE. Through her professional affiliations and academic service, she actively contributes to curriculum development, accreditation activities, peer review, editorial responsibilities, and policy-level academic initiatives.

With a strong commitment to academic excellence, mentorship, innovation, and interdisciplinary research, Dr. Meenu Gupta continues to advance the frontiers of AI-driven technologies and intelligent systems, while shaping future researchers and contributing meaningfully to technology-enabled societal transformation.`,
    education: [
      "Post-Doctoral Fellowship in CSE - MIR Lab, USA",
      "Ph.D. in Computer Science and Engineering - Ansal University, Gurugram",
      "M.Tech in Computer Science and Engineering",
      "MBA (Finance)",
      "B.Tech in Information Technology",
    ],
    researchInterests: [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
      "Data Mining",
      "Medical Image Analysis",
      "Social Network Analysis",
      "Internet of Things (IoT)",
      "Cloud Computing",
      "Big Data",
      "Blockchain",
    ],
    achievements: [
      "Senior Member of IEEE",
      "Executive Committee Member - IEEE Delhi Section",
      "Life Member of ISTE",
      "Samsung PRISM Best Project Award",
      "Multiple Granted Patents in AI & Healthcare",
      "18+ Years of Academic Experience",
    ],
    expertise: [
      "Alzheimer's Disease Diagnosis",
      "Cancer Detection",
      "PCOS Management",
      "Traffic Analytics",
      "IoT-enabled Healthcare Systems",
    ],
  },
  coEditorInChief: {
    name: "Dr. Rakesh Kumar",
    affiliation: "Chandigarh University, Mohali, Punjab, 140413, India",
    designation: "Associate Director, Department of CSE",
    image: "/images/coEditorInChief.jfif",
    role: "Co-Editor-in-Chief",
    biography: `Dr. Rakesh Kumar is a highly accomplished academician, researcher, and academic administrator with over 24 years of rich experience in teaching, research, academic leadership, and institutional development in the field of Computer Science and Engineering. He currently serves as Associate Director in the Department of Computer Science and Engineering at Chandigarh University, Punjab, India, where he plays a key role in strategic planning, research promotion, faculty development, and global academic outreach.

Dr. Kumar is a Senior Member of IEEE and is presently pursuing his Post-Doctoral Fellowship in Computer Science and Engineering from MIR Lab, USA, focusing on vertebra identification and Cobb angle estimation using deep learning for scoliosis detection. He earned his Ph.D. in Computer Science and Engineering from Punjab Technical University in 2017, with doctoral research on Hindi-to-Punjabi machine translation, particularly addressing word sense disambiguation of Hindi postpositions. His strong academic foundation also includes an M.Tech in Computer Science and Engineering and a Master of Computer Applications (MCA).

His research interests encompass Artificial Intelligence, Machine Learning, Deep Learning, Medical Image Analysis, Natural Language Processing, Computer Vision, Data Mining, Internet of Things (IoT), Cloud and Edge Computing, Big Data Analytics, and Intelligent Healthcare Systems. Dr. Kumar has made notable contributions in AI-driven medical diagnostics, including work on Alzheimer’s disease, breast cancer, scoliosis detection, cardiac imaging, PCOS management, ophthalmic disease detection, and neurological disorders, as well as in speech processing, social network analysis, remote sensing, and smart transportation systems.

Dr. Kumar has an exceptionally strong publication record, with a large number of papers published in SCI, SCIE, ESCI, Web of Science, and Scopus-indexed journals, including prestigious venues such as IEEE Access, Multimedia Tools and Applications, PLOS ONE, Reviews in Endocrine and Metabolic Disorders, Endocrine, Computers & Electrical Engineering, Current Medical Imaging, and Health Information Science and Systems. He has also authored and edited numerous international books published by Elsevier, Springer, CRC Press, IET, Bentham Science, and Taylor & Francis, covering advanced topics in AI, healthcare analytics, cloud computing, Industry 5.0, generative AI, nutrition intelligence, and sustainable technologies.

A recognized leader in academic event management and research dissemination, Dr. Kumar has served as Convener, Organizer, and Editor for multiple IEEE- and AIP-sponsored international conferences, including the International Conference on Advancement in Computation and Computer Technologies (InCACCT) and World Conference on Computational Science and Technology (WcCST). He has significantly contributed to strengthening international research collaboration and enhancing institutional research visibility through high-impact conferences and edited proceedings.

Dr. Kumar is a dedicated research mentor and doctoral supervisor, having guided a large number of Ph.D., M.Tech, and postgraduate scholars. His mentorship has resulted in high-quality publications, patents, funded research proposals, and industry-collaborative projects. He actively engages in peer review, editorial activities, technical program committees, and curriculum development, contributing to the advancement of engineering education and research quality.

With a rare blend of academic excellence, research depth, leadership capability, and global outlook, Dr. Rakesh Kumar continues to play a pivotal role in advancing AI-driven technologies, intelligent healthcare solutions, and interdisciplinary research, while nurturing future researchers and contributing meaningfully to the global scientific community.`,
    education: [
      "Post-Doctoral Fellow (Pursuing) - MIR Lab, USA",
      "Ph.D. in Computer Science and Engineering - Punjab Technical University, 2017",
      "M.Tech in Computer Science and Engineering",
      "Master of Computer Applications (MCA)",
    ],
    researchInterests: [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
      "Medical Image Analysis",
      "Natural Language Processing",
      "Computer Vision",
      "Data Mining",
      "Internet of Things (IoT)",
      "Cloud and Edge Computing",
      "Big Data Analytics",
      "Intelligent Healthcare Systems",
    ],
    achievements: [
      "Senior Member of IEEE",
      "24+ Years of Academic Experience",
      "Associate Director - CSE Department",
      "Multiple Books with Elsevier, Springer, CRC Press",
      "Conference Convener - InCACCT & WcCST",
      "Doctoral Supervisor - Multiple Ph.D. Scholars",
    ],
    expertise: [
      "Alzheimer's Disease Detection",
      "Breast Cancer Diagnosis",
      "Scoliosis Detection",
      "Cardiac Imaging",
      "PCOS Management",
      "Ophthalmic Disease Detection",
      "Hindi-Punjabi Machine Translation",
    ],
  },
};

// Full editorial board data
const editorialMembers = [
  {
    name: "Y surekha",
    affiliation: "Nit Nagaland",
    specialization: "Machine learning and Deep learning",
    role: "Area Editors",
  },
  {
    name: "Ghalia Nassreddine",
    affiliation: "Rafik hariri university, Lebanon",
    specialization:
      "advanced machine learning methodologies for optimizing decision-making and operational efficiency in Smart cities.",
    role: "Associate Editors",
  },
  {
    name: "Mithun Dutta",
    affiliation: "Rangamati Science and Technology University, Bangladesh",
    specialization: "Recognition and Detection in ML",
    role: "Associate Editors",
  },
  {
    name: "Mohammed Abdul Matheen",
    affiliation: "Saudi Electronic University, Riyadh, Saudi Arabia",
    specialization: "Wireless Sensors Network",
    role: "Associate Editors",
  },
  {
    name: "Rohit khankhoje",
    affiliation: "USA, independent researcher and corporate Quality leader",
    specialization: "AI/ML",
    role: "Associate Editors",
  },
  {
    name: "Dr. Deepika Agrawal",
    affiliation: "National Institute of Technology Raipur India",
    specialization: "Internet of Things",
    role: "Area Editors",
  },
  {
    name: "Dr. P. William",
    affiliation:
      "Sanjivani University, India || Victorian Institute of Technology, Australia || Amity University Dubai, UAE",
    specialization:
      "Artificial Intelligence Machine Learning Deep Learning Cloud Computing Cyber Security",
    role: "Associate Editors",
  },
  {
    name: "Ankit R. Patel",
    affiliation: "University of Minho, Portugal",
    specialization:
      "Cognitive Computing, Human-Computer Interaction and Human Factors",
    role: "Associate Editors",
  },
  {
    name: "Dr. TARUN JAISWAL",
    affiliation: "King abdulla university of science and technology, UAE",
    specialization: "Image processing, biomedical, IoT, AI, ML",
    role: "Area Editors",
  },
  {
    name: "Yogesh Kakde",
    affiliation: "Webster University Tashkent Uzbekistan",
    specialization:
      "Generative AI, Deep learning models, image processing with AI",
    role: "Associate Editors",
  },
  {
    name: "Dr. Dharmendra Kumar Yadav",
    affiliation:
      "National Institute of Health & Family Welfare (NIHFW), New Delhi, India",
    specialization:
      "Statistical Methods in Data Sciences, AI& ML in healthcare",
    role: "Associate Editors",
  },
  {
    name: "Shubham Malhotra",
    affiliation: "Amazon Web Services, Seattle, WA, USA",
    specialization:
      "Cloud Computing - distributed systems, performance engineering, optimization",
    role: "Associate Editors",
  },
  {
    name: "Dr. Rajasekaran S",
    affiliation: "University of Technology and Applied Sciences-Ibri, Oman",
    specialization: "Data Science, AI & ML, IoT",
    role: "Associate Editors",
  },
  {
    name: "Shashi Kant Gupta",
    affiliation: "Lincoln University College, Malaysia",
    specialization: "Computer Science and Engineering",
    role: "Associate Editors",
  },
  {
    name: "Dr Rejwan Bin Sulaiman",
    affiliation: "Northumbria University, UK",
    specialization: "AI and cyber security",
    role: "Area Editors",
  },
  {
    name: "Monu Sharma",
    affiliation: "Valley Health System, USA",
    specialization: "AI, ML, Data Science, SAAS, API",
    role: "Area Editors",
  },
  {
    name: "Karan Alang",
    affiliation: "Independent Researcher, CA USA 95014",
    specialization:
      "Data Engineering, Data Science, Big Data, Cloud Computing, ML/AI",
    role: "Area Editors",
  },
  {
    name: "Dr. Garima Nain",
    affiliation: "IIT Gandhinagar, India",
    specialization: "Deep learning retraining and maintenance",
    role: "Associate Editors",
  },
  {
    name: "ARUN KUMAR MAURYA",
    affiliation: "IIT ROORKEE INDIA",
    specialization: "COMPUTER, ELECTRICAL AND ENERGY SCIENCE",
    role: "Area Editors",
  },
  {
    name: "Dr. Harguneet Kaur",
    affiliation: "Delhi University, India",
    specialization: "Software Engineering",
    role: "Area Editors",
  },
  {
    name: "Ankur Vora",
    affiliation: "State University of NewYork at Binghamton",
    specialization: "5G, Timing Sync, Application of AI in 5G, MIMO",
    role: "Area Editors",
  },
  {
    name: "Dr. Debabrata Bej",
    affiliation: "Indian Institute of Technology Kharagpur, India",
    specialization: "Sensor, Embedded system and IoT",
    role: "Area Editors",
  },
  {
    name: "Mohan Krishna Mannava",
    affiliation: "University of Connecticut, USA",
    specialization: "Big Data Analytics & Machine Learning",
    role: "Associate Editors",
  },
  {
    name: "Milankumar Rana",
    affiliation: "University of the Cumberlands, USA",
    specialization: "Cloud Computing, Quantum Computing, AIOps, MLOps",
    role: "Area Editors",
  },
  {
    name: "Monu Sharma",
    designation: "Sr. IT Solutions Architect",
    affiliation: "Valley Health System, Winchester, Virginia, USA",
    email: "monu.sharma@ieee.org",
    role: "Editorial Board Member",
  },
  {
    name: "Dr. Ahmed Hussein Ali",
    designation: "Assistant Professor",
    department: "Computer Science",
    affiliation: "Al-Iraqia University, Baghdad, Iraq",
    email: "ahmed.ali@aliraqia.edu.iq",
    role: "Editorial Board Member",
  },
  {
    name: "Dr. Shakeel Ahmed",
    designation: "Associate Professor",
    department:
      "School of Computer Science, Faculty of Innovation and Technology",
    affiliation: "Taylor's University, Subang Jaya 47500, Selangor, Malaysia",
    email: "Shakeel.ahmed@taylors.edu.my",
    role: "Editorial Board Member",
  },
  {
    name: "Prof. (Dr.) Anand Nayyar",
    designation:
      "Professor, Scientist, Vice-Chairman (Research) and Director (IoT and Intelligent Systems Lab)",
    department: "School of Computer Science and Artificial Intelligence (SCA)",
    affiliation: "Duy Tan University, Da Nang 550000, Viet Nam",
    email: "anandnayyar@duytan.edu.vn",
    role: "Editorial Board Member",
  },
  {
    name: "Dr. Parvathaneni Naga Srinivasu",
    designation: "Research Head and Associate Professor",
    department: "Amrita School of Computing",
    affiliation:
      "Amrita Vishwa Vidyapeetham, Amaravati Campus, Amaravati 522503, Andhra Pradesh.",
    email: "p_nagasrinivasu@av.amrita.edu",
    role: "Editorial Board Member",
  },
  {
    name: "Dr. Hemanth.K.S",
    designation: "Associate Professor",
    department: "Department of Computer Science",
    affiliation:
      "Christ University Yeshwanthpur Campus, Nalagadderanahalli, Peenya, Bengaluru, Karnataka 560073.",
    email: "hemanth.ks@christuniversity.in",
    role: "Editorial Board Member",
  },
  {
    name: "Dr. Nassreddine, Ghalia",
    designation: "Chairperson and Associate Professor",
    department: "Information Technology and Systems",
    affiliation: "Rafik Hariri University, Lebanon",
    email: "nassreddinega@rhu.edu.lb",
    role: "Editorial Board Member",
  },
];

// Gender diversity data
const genderData = [
  { label: "Man", percentage: 71, color: "#00796b" },
  { label: "Woman", percentage: 23, color: "#26a69a" },
  { label: "Prefer not to disclose", percentage: 5, color: "#80cbc4" },
  { label: "Non-binary or gender diverse", percentage: 1, color: "#b2dfdb" },
];

// Role order for display
const roleOrder = [
  "Editorial Board Member",
  "Associate Editors",
  "Area Editors",
  "Managing Editor",
  "Honorary Editor",
  "Editorial Board",
  "Former Associate Editors",
];

// Group by role
const groupedMembers = editorialMembers.reduce((acc, member) => {
  if (!acc[member.role]) acc[member.role] = [];
  acc[member.role].push(member);
  return acc;
}, {});

// Biography Drawer Component
const BiographyDrawer = ({ isOpen, onClose, person }) => {
  if (!person) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#00796b] via-[#00897b] to-[#004d40] p-6 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <circle cx="80" cy="20" r="40" />
              <circle cx="20" cy="80" r="30" />
            </svg>
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-5">
              {/* Image */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=ffffff&color=00796b&size=150`;
                    }}
                  />
                </div>
                {/* Verified Badge */}
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                  <svg
                    className="w-4 h-4 text-[#00796b]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div>
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  {person.role}
                </span>
                <h2 className="text-2xl font-bold">{person.name}</h2>
                <p className="text-white/80 text-sm mt-1">
                  {person.designation}
                </p>
                <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {person.affiliation}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-5 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {person.role === "Editor-in-Chief" ? "18+" : "24+"}
              </p>
              <p className="text-xs text-white/70">Years Exp.</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {person.researchInterests?.length || 0}
              </p>
              <p className="text-xs text-white/70">Research Areas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">100+</p>
              <p className="text-xs text-white/70">Publications</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="h-[calc(100%-280px)] overflow-y-auto">
          {/* Contact Info */}
          {person.email && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <a
                href={`mailto:${person.email}`}
                className="inline-flex items-center gap-2 text-[#00796b] hover:text-[#004d40] text-sm font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {person.email}
              </a>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Biography */}
            <div>
              <h3 className="text-lg font-bold text-[#00796b] mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Biography
              </h3>
              <div className="text-gray-600 text-sm leading-relaxed space-y-3">
                {person.biography.split("\n\n").map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            </div>

            {/* Education */}
            {person.education && person.education.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-[#00796b] mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                  Education
                </h3>
                <ul className="space-y-2">
                  {person.education.map((edu, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-600 text-sm"
                    >
                      <span className="w-6 h-6 bg-[#e0f2f1] text-[#00796b] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Research Interests */}
            {person.researchInterests &&
              person.researchInterests.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-[#00796b] mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Research Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {person.researchInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-[#e0f2f1] to-[#b2dfdb] text-[#00796b] px-3 py-1.5 rounded-full text-xs font-medium border border-[#00796b]/10"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Expertise Areas */}
            {person.expertise && person.expertise.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-[#00796b] mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  Key Expertise Areas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {person.expertise.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <svg
                        className="w-4 h-4 text-[#00796b] flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="line-clamp-1">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {person.achievements && person.achievements.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-[#00796b] mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  Achievements & Recognition
                </h3>
                <ul className="space-y-2">
                  {person.achievements.map((achievement, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-gray-600 text-sm"
                    >
                      <span className="text-yellow-500 text-lg">🏆</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Top Leadership Card Component
const LeadershipCard = ({ person, isPrimary = false, onViewBio }) => (
  <div
    className={`relative overflow-hidden rounded-2xl ${
      isPrimary
        ? "bg-gradient-to-br from-[#00796b] to-[#004d40]"
        : "bg-gradient-to-br from-[#26a69a] to-[#00796b]"
    } p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
  >
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
      <svg viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" />
        <circle cx="20" cy="20" r="15" />
        <circle cx="80" cy="80" r="20" />
      </svg>
    </div>

    {/* Role Badge */}
    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
      {person.role}
    </div>

    {/* Content */}
    <div className="flex items-center gap-5">
      {/* Image */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
          <img
            src={person.image}
            alt={person.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=ffffff&color=00796b&size=150&font-size=0.35`;
            }}
          />
        </div>
        {/* Verified Badge */}
        <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1.5 shadow-lg">
          <svg
            className="w-3 h-3 text-[#00796b]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold mb-1">{person.name}</h3>
        <p className="text-white/90 text-xs mb-2">{person.designation}</p>
        <p className="text-white/70 text-sm flex items-start gap-2 mb-4">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-1">{person.affiliation}</span>
        </p>

        {/* View Biography Button */}
        <button
          onClick={() => onViewBio(person)}
          className="inline-flex items-center gap-2 bg-white text-[#00796b] hover:bg-yellow-400 hover:text-[#004d40] px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 group shadow-md"
        >
          View Full Biography
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

// Gender Diversity Component
const GenderDiversity = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-bold text-[#00796b] mb-2 flex items-center gap-2">
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      Gender Diversity
    </h3>
    <p className="text-sm text-gray-500 mb-5">
      of editors and editorial board members
    </p>

    {/* Circular Progress Indicator */}
    <div className="flex justify-center mb-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#00796b"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${71 * 3.52} ${100 * 3.52}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-[#00796b]">71%</span>
            <p className="text-xs text-gray-500">Male</p>
          </div>
        </div>
      </div>
    </div>

    {/* Legend */}
    <div className="space-y-2">
      {genderData.map((item, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>

    <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 text-center">
      Data from 55% of 214 editorial board members
    </p>
  </div>
);

// Editor Card Component
const EditorCard = ({
  name,
  designation,
  department,
  affiliation,
  email,
  specialization,
}) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-[#00796b]/30 transition-all duration-300 group h-full">
    <div className="flex items-start gap-4 h-full">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00796b] to-[#26a69a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-[#212121] group-hover:text-[#00796b] transition-colors">
          {name}
        </h4>
        {designation && (
          <p className="text-sm font-medium text-[#00796b] mt-1">
            {designation}
          </p>
        )}
        {department && (
          <p className="text-xs font-semibold text-gray-700 mt-1">
            {department}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {affiliation}
        </p>
        {email && (
          <a
            href={`mailto:${email}`}
            className="text-xs text-[#00796b] hover:underline mt-1 inline-flex items-center gap-1"
          >
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate">{email}</span>
          </a>
        )}
        {specialization && (
          <p className="text-xs text-[#00796b]/80 mt-2 line-clamp-1">
            {specialization}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Section Title Component
const SectionTitle = ({ title, count }) => (
  <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-[#00796b]/20">
    <div className="w-1 h-6 bg-[#00796b] rounded-full"></div>
    <h3 className="text-xl font-bold text-[#212121]">{title}</h3>
    {count > 0 && (
      <span className="bg-[#00796b] text-white text-xs font-bold px-2.5 py-1 rounded-full">
        {count}
      </span>
    )}
  </div>
);

const EditorialBoard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const handleViewBio = (person) => {
    setSelectedPerson(person);
    setDrawerOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPerson(null);
    document.body.style.overflow = "unset";
  };

  return (
    <section className="max-w-7xl mx-auto my-8 px-4 md:px-8">
      {/* Page Title */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#00796b] tracking-tight">
          Editorial Board
        </h2>
        {/* <p className="text-gray-600 mt-2">
          Meet our distinguished team of editors and reviewers
        </p> */}
      </div>

      {/* Top Leadership Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <LeadershipCard
          person={topLeadership.editorInChief}
          isPrimary={true}
          onViewBio={handleViewBio}
        />
        <LeadershipCard
          person={topLeadership.coEditorInChief}
          isPrimary={false}
          onViewBio={handleViewBio}
        />
      </div>

      {/* Main Layout - Two Columns */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Sticky */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-8 space-y-6">
            <GenderDiversity />

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2] rounded-xl p-5 border border-[#00796b]/10">
              <h4 className="font-bold text-[#00796b] mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Total Members</span>
                  <span className="font-bold text-[#00796b]">
                    {editorialMembers.length + 2}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Countries</span>
                  <span className="font-bold text-[#00796b]">25+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Institutions</span>
                  <span className="font-bold text-[#00796b]">40+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Editorial Board Members */}
        <div className="flex-1">
          {roleOrder.map((role) => {
            const members = groupedMembers[role];

            if (!members || members.length === 0) return null;

            return (
              <div key={role} className="mb-10">
                <SectionTitle title={role} count={members.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((member, index) => (
                    <EditorCard
                      key={index}
                      name={member.name}
                      designation={member.designation}
                      department={member.department}
                      affiliation={member.affiliation}
                      email={member.email}
                      specialization={member.specialization}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Footer Note */}
          <div className="mt-10 p-5 bg-gray-50 rounded-xl border-l-4 border-[#00796b]">
            <p className="text-sm text-gray-600">
              <strong className="text-[#00796b]">Note:</strong> All members of
              the Editorial Board have identified their affiliated institutions
              or organizations, along with the corresponding country or
              geographic region. The publisher remains neutral with regard to
              any jurisdictional claims.
            </p>
          </div>
        </div>
      </div>

      {/* Biography Drawer */}
      <BiographyDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        person={selectedPerson}
      />
    </section>
  );
};

export default EditorialBoard;
