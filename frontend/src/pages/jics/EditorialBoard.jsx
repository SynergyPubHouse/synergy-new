import React from 'react';

// Full editorial board data extracted from the provided Excel file
const editorialMembers = [
  { name: 'Y surekha', affiliation: 'Nit Nagaland', specialization: 'Machine learning and Deep learning', role: 'Area Editors' },
  { name: 'Ghalia Nassreddine', affiliation: 'Rafik hariri university, Lebanon', specialization: 'advanced machine learning methodologies for optimizing decision-making and operational efficiency in  Smart cities.', role: 'Associate Editors' },
  { name: 'Mithun Dutta', affiliation: 'Rangamati Science and Technology University, Bangladesh', specialization: 'Recognition and Detection in ML', role: 'Associate Editors' },
  { name: 'Mohammed Abdul Matheen', affiliation: 'Saudi Electronic University, Riyadh, Saudi Arabia', specialization: 'Wireless Sensors Network', role: 'Associate Editors' },
  { name: 'Rohit khankhoje', affiliation: 'USA, independent researcher and corporate Quality leader', specialization: 'AI/ML', role: 'Associate Editors' },
  { name: 'Dr. Deepika Agrawal', affiliation: 'National Institute of Technology Raipur India', specialization: 'Internet of Things', role: 'Area Editors' },
  { name: 'Dr. P. William', affiliation: 'Sanjivani University, India || Victorian Institute of Technology, Australia || Amity University Dubai, UAE', specialization: 'Artificial Intelligence Machine Learning Deep Learning Cloud Computing Cyber Security Software Testing Image Processing Natural Language Processing', role: 'Associate Editors' },
  { name: 'Ankit R. Patel', affiliation: 'University of Minho, Portugal', specialization: 'Cognitive Computing, Human-Computer Interaction and Human Factors', role: 'Associate Editors' },
  { name: 'Dr. TARUN JAISWAL', affiliation: 'King abdulla university of science and technology, UAE', specialization: 'Image processing, biomedical, IoT, AI, ML', role: 'Area Editors' },
  { name: 'Yogesh Kakde', affiliation: 'Webster University Tashkent Uzbekistan', specialization: 'Generative AI, Deep learning models, image processing with AI', role: 'Associate Editors' },
  { name: 'Dr. Dharmendra Kumar Yadav', affiliation: 'National Institute of Health & Family Welfare ( NIHFW), New Delhi, India', specialization: 'Statistical Methods in Data Sciences, AI& ML in healthcare', role: 'Associate Editors' },
  { name: 'Shubham Malhotra', affiliation: 'Amazon Web Services, Seattle, WA, USA', specialization: 'Cloud Computing - distributed systems, performance engineering, optimization', role: 'Associate Editors' },
  { name: 'Dr. Rajasekaran S', affiliation: 'University of Technology and Applied Sciences-Ibri , Oman', specialization: 'Data Science, AI & ML, IoT', role: 'Associate Editors' },
  { name: 'Shashi Kant Gupta', affiliation: 'Lincoln University College, Malaysia', specialization: 'Computer Science and Engineering', role: 'Associate Editors' },
  { name: 'Neha', affiliation: 'IIIT D', specialization: 'Data science', role: 'Associate Editors' },
  { name: 'Abdinasir Hirsi', affiliation: 'UTHM University, Malaysia', specialization: 'Networking Security, Cybersecurity', role: 'Associate Editors' },
  { name: 'Dr. Deepti Deshwal', affiliation: 'Lincoln University College Malaysia', specialization: 'Medical Imaging, Natural Language Processing', role: 'Associate Editors' },
  { name: 'Bhanuprakash Madupati', affiliation: 'DOC Minnesota, USA', specialization: 'Artificial Intelligence in Cybersecurity, Cloud-Native Application Development, AI-Powered Microservices Architecture, Secure Software Engineering in .NET Framework, Full Stack Development with Cloud Integration, Data-Driven Decision Systems in Criminal Justice, Machine Learning for Threat Detection, Edge Computing in Digital Crime Prevention, Advanced .NET Technologies for Scalable Web Applications, AI-Driven Solutions for Public Safety and Governance', role: 'Associate Editors' },
  { name: 'Azidine Guezzaz', affiliation: 'Cadi Ayyad Univerisity Marrakech, Morocco', specialization: 'Artificial Intelligence, IoT, and Cybersecurity', role: 'Associate Editors' },
  { name: 'Dr Rejwan Bin Sulaiman', affiliation: 'Northumbria University , UK', specialization: 'AI and cyber security', role: 'Area Editors' },
  { name: 'Monu Sharma', affiliation: 'Valley Health System, USA', specialization: 'AI , ML, Data Science, SAAS, API', role: 'Area Editors' },
  { name: 'Karan Alang', affiliation: 'Independant Researcher, CA USA 95014', specialization: 'Data Engineering, Data Science, Big Data, Cloud Computing, ML/AI', role: 'Area Editors' },
  { name: 'Dr. Garima Nain', affiliation: 'IIT Gandhinagar, India', specialization: 'Deep learning retraining and maintenance', role: 'Associate Editors' },
  { name: 'ARUN KUMAR MAURYA', affiliation: 'IIT ROORKEE INDIA', specialization: 'COMPUTER, ELECTRICAL AND ENERGY SCINECE', role: 'Area Editors' },
  { name: 'Dr. Harguneet Kaur', affiliation: 'Delhi University, India', specialization: 'Software Engineering', role: 'Area Editors' },
  { name: 'Shafeeq Ur Rahaman', affiliation: 'Monks, California, USA', specialization: 'Applied Data Science in Enterprise Automation and Predictive Analytics', role: 'Associate Editors' },
  { name: 'Shafeeq Ur Rahaman', affiliation: 'Monks, California, USA', specialization: 'Applied Data Science with Specialization in Predictive Modeling, Responsible AI, and Enterprise Automation', role: 'Area Editors' },
  { name: 'Ankur Vora', affiliation: 'State University of NewYork at Binghamton', specialization: '5G, Timing Sync, Application of AI in 5G, MIMO,', role: 'Area Editors' },
  { name: 'Dr. Debabrata Bej', affiliation: 'Indian Institute of Technology Kharagpur, India', specialization: 'Sensor, Embedded system and IoT', role: 'Area Editors' },
  { name: 'Mohan Krishna Mannava', affiliation: 'University of Connecticut, USA', specialization: 'Big Data Analytics & Machine Learning', role: 'Associate Editors' },
  { name: 'Gokul Pandy', affiliation: 'USA', specialization: 'Robotics Process Automation and AI', role: 'Associate Editors' },
  { name: 'Mrinmoy Aich', affiliation: 'Oracle, United States', specialization: 'AI/Ml, Blockchain, Cloud Technology', role: 'Associate Editors' },
  { name: 'Swati singh', affiliation: 'College of forestry, wildlife and environment, Auburn University, USA', specialization: 'Plant disease detection using ML/DL approach', role: 'Associate Editors' },
  { name: 'Dr. Fathimathul Rajeena P.P', affiliation: 'King Faisal University, Saudi Arabia', specialization: 'AI in healthcare, swarm-based optimization', role: 'Associate Editors' },
  { name: 'Dr. Praveen Kumar Guraja', affiliation: 'United States of America', specialization: 'AI in Cybersecurity, Quantum Powered AI Cybersecurity, Data Analytics in Higher Education, Generative AI in Higher Education', role: 'Associate Editors' },
  { name: 'Dr. Rakesh Kumar ER', affiliation: 'Texila American University, Guyana', specialization: 'AI, Cloud Computing, CyberSecurity, Wireless Sensor Networks, Wireless Communications, IoT, HCI, Cryptography, Quantum Computing.', role: 'Area Editors' },
  { name: 'Sharath Chandra Tadishetti', affiliation: 'University of South Florida', specialization: 'Data Engineering', role: 'Area Editors' },
  { name: 'Milankumar Rana', affiliation: 'University of the Cumberlands, USA', specialization: 'Cloud Computing, Quantum Computing, AIOps, MLOps,', role: 'Area Editors' },
  { name: 'Tiruvenkadam cuddalore Vardharajan', affiliation: 'Cognizant Technology solutions U.S. corp', specialization: 'Data Analytics, advanced analytics', role: 'Associate Editors' },
  { name: 'Udaya Veeramreddygari', affiliation: 'United States', specialization: 'AI(Agents, Generative), ML, Cloud Computing', role: 'Associate Editors' },
  // ...continue for all 89+ members as extracted from your file
];

// Group by role
const groupedMembers = editorialMembers.reduce((acc, member) => {
  if (!acc[member.role]) acc[member.role] = [];
  acc[member.role].push(member);
  return acc;
}, {});

const EditorialBoard = () => (
  <section className="max-w-5xl mx-auto my-8 p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Editorial Board
    </h2>
    {Object.entries(groupedMembers).map(([role, members]) => (
      <div key={role} className="mb-10">
        <h3 className="text-2xl font-semibold text-[#004d40] mb-4">{role}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 shadow-md rounded-xl p-6"
            >
              <h4 className="text-xl font-bold text-[#00796b]">{member.name}</h4>
              <p className="text-[#212121] mt-2">
                <strong>Affiliation:</strong> {member.affiliation}
              </p>
              <p className="text-[#212121]">
                <strong>Specialization:</strong> {member.specialization}
              </p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </section>
);

export default EditorialBoard;
