import React from 'react';

const Header = () => (
  <section className="pt-[120px] w-full bg-[#f9f9f9] border-b border-[#e0e0e0] py-12"> {/* Reduced top padding */}
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 px-6">
      {/* Logo and Decorative Accent */}
      <div className="flex flex-col items-center md:items-start gap-4">
        <div className="relative">
          <img
            src="/images/SWP-bgremove.png"
            alt="Synergy World Press Logo"
            className="w-32 h-33 md:w-40 md:h-40 object-contain"
          />
        </div>
      </div>

      {/* Brand and Ideation */}
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#00796b] leading-tight mb-3 drop-shadow-sm">
          Synergy World Press
        </h1>
        <p className="text-xl text-[#212121] font-medium mb-6 max-w-2xl mx-auto md:mx-0">
          Advancing Knowledge. Empowering Research. <br className="hidden md:inline" />
          <span className="text-[#00acc1] font-semibold">A global platform for interdisciplinary scholarly publishing.</span>
        </p>
        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <a
            href="#about"
            className="bg-[#00796b] hover:bg-[#00acc1] text-white font-semibold px-7 py-3 rounded-lg shadow transition-colors text-lg"
          >
            Learn More
          </a>
          <a
            href="#submit"
            className="border-2 border-[#00acc1] text-[#00796b] hover:bg-[#00acc1] hover:text-white font-semibold px-7 py-3 rounded-lg transition-colors text-lg"
          >
            Submit Your Article
          </a>
        </div> */}
      </div>
    </div>
  </section>
);

export default Header;
