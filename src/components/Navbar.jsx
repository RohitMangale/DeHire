import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Logo from './Logo';

const Navbar = ({ account, connectWallet }) => {
  const [userName, setUserName] = useState('');

  // Load user name from profile when account changes
  useEffect(() => {
    if (account) {
      try {
        const savedProfile = localStorage.getItem(`profile_${account}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setUserName(parsed.name || '');
        } else {
          setUserName('');
        }
      } catch (error) {
        console.error('Error loading profile name:', error);
        setUserName('');
      }
    } else {
      setUserName('');
    }
  }, [account]);

  // Listen for profile updates (when user saves profile)
  useEffect(() => {
    const handleStorageChange = () => {
      if (account) {
        try {
          const savedProfile = localStorage.getItem(`profile_${account}`);
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setUserName(parsed.name || '');
          }
        } catch (error) {
          console.error('Error loading profile name:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event when profile is saved in same tab
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, [account]);

  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-white shadow-lg pb-5 z-50">
      {/* Logo Section */}
      <div className="flex justify-between space-x-2 ">
        <Link to='/'  className="flex gap-2 items-center justify-between border border-gray-200 rounded-lg  px-3 py-1  bg-white/80 cursor-pointer hover:bg-gray-50 transition-colors">
            <Logo />
        </Link>
        <div className="flex space-x-4 border border-gray-200 rounded-lg  px-3 py-1  bg-white/80">
          <Link to="/yourjobs" className="text-gray-700 p-2 px-3 hover:bg-gray-100 font-medium rounded-md">My Jobs</Link>
          <Link to="/find-job" className="text-gray-700 p-2 px-3 hover:bg-gray-100 font-medium rounded-md">Explore Jobs</Link>
          <Link to="/applied_jobs" className="text-gray-700 p-2 px-3 hover:bg-gray-100 font-medium rounded-md">My Applications</Link>
          <Link to="/jobs-got" className="text-gray-700 p-2 px-3 hover:bg-gray-100 font-medium rounded-md">Jobs Got</Link>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex items-center space-x-6">
       
        
        {/* Right Side Buttons */}
        <div className="flex items-center space-x-3 gap-2">
            <div className='  border border-gray-200 rounded-lg  px-1 py-2.5 bg-white/80'>
                <Link to="" className="text-gray-700  hover:bg-gray-100 font-medium px-3 py-2  rounded-md">
                    Contact Sales
                </Link>
            </div>

          <Link to="/Profile" onClick={connectWallet} className="px-4 py-2.5 text-white font-semibold bg-blue-500 rounded-md hover:bg-blue-600 transition-colors">
              {account ? (userName || 'Profile') : "Connect to Wallet"}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

