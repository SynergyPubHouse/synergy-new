import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBars, FaTimes, FaSearch, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../App';

const BASE_URL = '';

const Navbar = () => {
  const { user, logout } = useAuth();
  console.log("user", user)
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.email
    : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false); // name info dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false); // icon options dropdown
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  console.log("user", user)

  const rawRoles = (user?.availableRoles || user?.roles || []).map((r) =>
    (typeof r === 'string' ? r : r?.role) || 'author'
  );
  const hasRole = (role) => rawRoles.includes(role);

  const logoTarget = hasRole('editor') && rawRoles.length === 1
    ? '/journal/jics/editor/dashboard'
    : location.pathname.includes('/editor')
      ? '/journal/jics/editor/dashboard'
      : location.pathname.includes('/reviewer')
        ? '/journal/jics/reviewer/dashboard'
        : '/';
  const availableRoles = [
    ...(hasRole('author')
      ? [{ key: 'author', label: 'Author', path: '/journal/jics/about/overview' }]
      : []),
    ...(hasRole('reviewer')
      ? [{ key: 'reviewer', label: 'Reviewer', path: '/journal/jics/reviewer/dashboard' }]
      : []),
    ...(hasRole('editor')
      ? [{ key: 'editor', label: 'Editor', path: '/journal/jics/editor/dashboard' }]
      : []),
  ]
  const currentRole = location.pathname.includes('/editor')
    ? 'editor'
    : location.pathname.includes('/reviewer')
      ? 'reviewer'
      : 'author';

  const handleLogoutConfirm = () => {
    logout();
    setLogoutModalOpen(false);
    navigate("/");
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
        setUserMenuOpen(false);
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
        <Link to={logoTarget} className="flex items-center hover:opacity-80 transition-opacity">
          <img
            src="/images/SWP-bgremove.png"
            alt="Synergy World Press Logo"
            className="h-10 w-auto rounded-md"
          />
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
              {location.pathname !== "/" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center gap-1 text-sm focus:outline-none"
                  >
                    <span className="flex items-center gap-1">
                      {displayName}
                      <FaChevronDown className="w-3 h-3" />
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center focus:outline-none"
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
                  </button>
                </div>
              )}

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white text-[#212121] border border-[#e0e0e0] shadow-lg"
                  >
                    <div className="text-sm">
                      <div className="flex justify-between px-4 py-2 border-b border-[#e0e0e0]">
                        <span className="text-gray-600">Username</span>
                        <span className="font-semibold truncate max-w-[55%] text-right">{displayName || user.email}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[#e0e0e0] gap-3">
                        <span className="text-gray-600">Role</span>
                        {availableRoles.length > 1 ? (
                          <select
                            value={currentRole}
                            onChange={(e) => {
                              const sel = e.target.value;
                              const target = (availableRoles.find(r => r.key === sel) || { path: '/' }).path;
                              setUserDropdownOpen(false);
                              navigate(target);
                            }}
                            className="border border-[#e0e0e0] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#00acc1] max-w-[55%]"
                          >
                            {availableRoles.map((r) => (
                              <option key={r.key} value={r.key}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-semibold">
                            {(availableRoles.find(r => r.key === currentRole) || { label: 'Author' }).label}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between px-4 py-2 border-b border-[#e0e0e0]">
                        <span className="text-gray-600">Site Language</span>
                        <span className="font-semibold">English</span>
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-[#0077cc] hover:bg-[#f5f5f5]"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate(`${BASE_URL}/account`);
                        }}
                      >
                        Update My Information
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon options dropdown (My Account, etc.) */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-3 text-[#212121] border border-[#e0e0e0] ring-1 ring-black/5"
                  >
                    <div className="px-4 pb-3 text-sm">
                      <p className="font-semibold truncate">{displayName}</p>
                      <p className="opacity-70 text-xs truncate">{user.email}</p>
                    </div>
                    <hr className="border-[#e0e0e0] my-1" />
                    <Link
                      to={`${BASE_URL}/account`}
                      className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors rounded-md mx-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    {hasRole('author') && (
                      <Link
                        to="/journal/jics/my-submissions"
                        className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors rounded-md mx-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Submissions
                      </Link>
                    )}

                    {hasRole('editor') && (
                      <Link
                        to="/journal/jics/editor/dashboard"
                        className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors rounded-md mx-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Editor Dashboard
                      </Link>
                    )}
                    <Link
                      to={`${BASE_URL}/subscriptions`}
                      className="block px-4 py-2 text-sm hover:bg-[#00acc1] hover:text-white transition-colors rounded-md mx-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Subscriptions
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setLogoutModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-600/10 hover:text-red-700 transition-colors rounded-md mx-2"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            location.pathname !== '/' && (
              <div className="hidden md:flex gap-4">
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="text-white font-semibold px-4 py-2 rounded-md border-2 border-[#00acc1] hover:bg-[#00acc1] hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#00acc1] text-white font-semibold px-5 py-2 rounded-md shadow transition-colors hover:bg-[#0097a7]"
                >
                  Register
                </Link>
              </div>
            )
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
                onClick={() => setLogoutModalOpen(true)}
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
      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {logoutModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setLogoutModalOpen(false)}
            />
            <motion.div
              className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-lg shadow-lg p-6 text-[#1a365d]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogoutModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 text-sm rounded-md bg-[#00acc1] text-white hover:bg-[#0097a7]"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
