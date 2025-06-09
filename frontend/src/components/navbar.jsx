import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import { useAuth } from '../App';

const BASE_URL = '/';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      navigate("/");
    }
  };

  const navItems = [
    // { name: 'Publish With Us', path: `${BASE_URL}publish` },
    // { name: 'For Reviewers', path: `${BASE_URL}/reviewer` },
    // { name: 'Track Your Research', path: `${BASE_URL}track` }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 w-full p-4 shadow-lg fixed w-full z-50 transition-all bg-[#00796b] text-white"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to={BASE_URL} className="text-2xl font-bold hover:text-[#BAFFF5] transition-colors">
          Synergy World Press
        </Link>

        <div className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative font-medium transition-all hover:text-[#00acc1] ${location.pathname === item.path ? 'text-[#00acc1] font-bold' : ''}`}
            >
              {item.name}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 -bottom-1 w-full h-1 bg-[#00acc1] rounded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-10 h-10 rounded-full border-2 border-[#00acc1]"
                  />
                ) : (
                  <FaUserCircle className="w-10 h-10 text-[#00acc1]" />
                )}
                <span className="text-sm">{user?.name}</span>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-[#212121] border border-[#e0e0e0]"
                  >
                    <div className="px-4 py-2 text-sm">
                      <p className="font-semibold">{user.name}</p>
                      <p className="opacity-80">{user.email}</p>
                    </div>
                    <hr className="border-[#e0e0e0] my-2" />
                    <Link
                      to={`${BASE_URL}account`}
                      className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors"
                    >
                      My Account
                    </Link>
                    <Link
                      to={`${BASE_URL}subscriptions`}
                      className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors"
                    >
                      My Subscriptions
                    </Link>
                    {/* <Link
                      to={`${BASE_URL}settings`}
                      className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors"
                    >
                      Settings
                    </Link> */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex gap-4">
              <Link
                to={`/login`}
                className="text-white font-semibold px-4 py-2 rounded-md border-2 border-[#00acc1] hover:bg-[#00acc1] hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to={`/register`}
                className="bg-[#00acc1] text-white font-semibold px-5 py-2 rounded-md shadow transition-colors hover:bg-[#0097a7]"
              >
                Register
              </Link>
            </div>
          )}

          <button
            className="md:hidden text-xl hover:text-[#00acc1] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg py-4 flex flex-col items-center gap-4 text-[#212121] border-b border-[#e0e0e0]"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-lg font-medium transition-all hover:text-[#00acc1] ${location.pathname === item.path ? 'font-bold text-[#00acc1]' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to={`${BASE_URL}/account`}
                className="text-lg font-medium transition-all hover:text-[#00acc1]"
                onClick={() => setMenuOpen(false)}
              >
                My Account
              </Link>
              <Link
                to={`${BASE_URL}/subscriptions`}
                className="text-lg font-medium transition-all hover:text-[#00acc1]"
                onClick={() => setMenuOpen(false)}
              >
                My Subscriptions
              </Link>
              <Link
                to={`${BASE_URL}/settings`}
                className="text-lg font-medium transition-all hover:text-[#00acc1]"
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-lg font-medium transition-all hover:text-[#00acc1]"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 w-full px-4">
              <Link
                to={`${BASE_URL}/login`}
                className="text-center bg-[#00acc1] text-white font-medium py-2 rounded-lg hover:bg-[#0097a7] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to={`${BASE_URL}/register`}
                className="text-center border-2 border-[#00acc1] text-[#212121] font-medium px-4 py-2 rounded-lg hover:bg-[#00acc1] hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
