// Profile.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import blockies from 'ethereum-blockies-base64';

const Profile = ({ account, connectWallet }) => {
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile fields
  const [profileData, setProfileData] = useState({
    name: '',
    role: 'Freelancer',
    bio: '',
    location: '',
    email: '',
    phone: '',
    // Freelancer-focused fields
    hourlyRate: '',
    experienceLevel: 'Beginner',
    skills: '',
    portfolioUrl: '',
    projects: '',
    // Client/company-focused fields
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    // `feedback` is intentionally not user-editable. It is meant to be
    // populated by clients after completed work (e.g., via on-chain or
    // backend reviews) and only displayed here.
    feedback: '',
    linkedinUrl: '',
    githubUrl: '',
  });

  // Load profile data from localStorage
  const loadProfileData = () => {
    if (account) {
      // Try both lowercase and original case
      const keysToTry = [
        `profile_${account}`,
        `profile_${account.toLowerCase()}`,
      ];
      
      let savedProfile = null;
      for (const key of keysToTry) {
        savedProfile = localStorage.getItem(key);
        if (savedProfile) break;
      }
      
      // Also search all localStorage keys
      if (!savedProfile) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('profile_')) {
            const addressFromKey = key.replace('profile_', '');
            if (addressFromKey.toLowerCase() === account.toLowerCase()) {
              savedProfile = localStorage.getItem(key);
              break;
            }
          }
        }
      }
      
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          console.log('Loaded profile data:', parsed);
          console.log('Feedback in profile:', parsed.feedback);
          setProfileData(parsed);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      } else {
        console.log('No profile found for account:', account);
      }
    }
  };

  // Load profile data on mount and when account changes
  useEffect(() => {
    loadProfileData();
  }, [account]);

  // Listen for feedback updates and profile changes
  useEffect(() => {
    if (!account) return;
    
    // Listen for storage events (when feedback is added in another tab)
    const handleStorageChange = (e) => {
      if (e.key) {
        // Check if it's a profile key for this account (case-insensitive)
        if (e.key.startsWith('profile_')) {
          const addressFromKey = e.key.replace('profile_', '');
          if (addressFromKey.toLowerCase() === account.toLowerCase()) {
            console.log('Profile updated detected via storage event:', e.key);
            loadProfileData();
          }
        } else if (e.key.startsWith('feedback_')) {
          // Also reload if feedback key changes
          loadProfileData();
        }
      }
    };

    // Listen for custom feedbackSubmitted event
    const handleFeedbackSubmitted = (e) => {
      const detail = e.detail || {};
      const applicant = detail.applicant || detail.applicantLower;
      if (applicant && applicant.toLowerCase() === account.toLowerCase()) {
        console.log('Feedback submitted event received for this account');
        loadProfileData();
      } else {
        // Also reload if no detail provided (might be for this account)
        loadProfileData();
      }
    };

    // Also check periodically for feedback updates (every 3 seconds)
    const intervalId = setInterval(() => {
      loadProfileData();
    }, 3000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
      clearInterval(intervalId);
    };
  }, [account]);

  // Format account address to show only first 3 and last 4 characters
  const formatAccount = (address) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Generate Blockie avatar based on Ethereum address
  const accountImage = account ? blockies(account) : null;

  // Fetch balance from the connected wallet with error handling
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account || !window.ethereum) {
        setBalance(null);
        setBalanceError(null);
        return;
      }

      setIsLoadingBalance(true);
      setBalanceError(null);

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check if we're on the right network (Ganache typically uses chainId 1337 or 5777)
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        console.log('Network Chain ID:', network.chainId);
        console.log('Account address:', account);
        
        // Warn if not on Ganache network
        if (network.chainId !== 1337 && network.chainId !== 5777) {
          console.warn('⚠️ Not connected to Ganache! Current Chain ID:', network.chainId, 'Expected: 1337 or 5777');
          
          // Try to automatically switch to Ganache network
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }], // 1337 in hex
            });
            // If successful, retry balance fetch
            const retryBalance = await provider.getBalance(account);
            const balanceInEth = ethers.utils.formatEther(retryBalance);
            console.log('Balance fetched after network switch:', balanceInEth, 'ETH');
            setBalance(balanceInEth);
            setBalanceError(null);
            return;
          } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x539', // 1337 in hex
                    chainName: 'Ganache Local',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['http://localhost:7545'],
                    blockExplorerUrls: null
                  }],
                });
                // After adding, retry balance fetch
                const retryBalance = await provider.getBalance(account);
                const balanceInEth = ethers.utils.formatEther(retryBalance);
                console.log('Balance fetched after adding network:', balanceInEth, 'ETH');
                setBalance(balanceInEth);
                setBalanceError(null);
                return;
              } catch (addError) {
                console.error('Error adding network:', addError);
              }
            } else {
              console.error('Error switching network:', switchError);
            }
          }
          
          // If auto-switch failed, show manual instructions
          setBalanceError(`Wrong network! You're on Chain ID ${network.chainId}. Please switch to Ganache (Chain ID 1337) in MetaMask. Click the network dropdown and select "Ganache Local" or add it manually with RPC URL: http://localhost:7545`);
          setBalance(null);
          return;
        }

        // Get balance with timeout
        const balancePromise = provider.getBalance(account);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balance fetch timeout')), 10000)
        );

        const balance = await Promise.race([balancePromise, timeoutPromise]);
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log('Balance fetched:', balanceInEth, 'ETH');
        setBalance(balanceInEth);
        setBalanceError(null);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalanceError('Unable to fetch balance. Make sure Ganache is running and MetaMask is connected to the correct network.');
        setBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (account) {
      // Save to localStorage
      localStorage.setItem(`profile_${account}`, JSON.stringify(profileData));
      setIsEditing(false);
      alert('Profile saved successfully!');
      // Dispatch custom event to notify navbar of profile update
      window.dispatchEvent(new Event('profileUpdated'));
    } else {
      alert('Please connect your wallet to save profile');
    }
  };

  const handleCancel = () => {
    // Reload from localStorage
    if (account) {
      const savedProfile = localStorage.getItem(`profile_${account}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfileData(parsed);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    }
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-md w-full max-w-2xl m-auto mt-24">
      {accountImage && (
        <div className="w-24 h-24 mb-4 rounded-full overflow-hidden">
          <img src={accountImage} alt="Account Avatar" className="w-full h-full" />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-2">Welcome, {profileData.name || 'User'}</h2>
      <p className="text-gray-600 mb-6 text-lg">Role: <span className="font-semibold text-blue-600">{profileData.role}</span></p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Full Name:</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-lg bg-gray-50 p-2 rounded-md">{profileData.name || 'No Name Set'}</p>
          )}
        </div>

        <div>
          <p className="text-gray-700 mb-2 font-semibold">Wallet Address:</p>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded-md break-all">{account ? formatAccount(account) : 'Not connected'}</p>
        </div>
      </div>

      <div className="w-full mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">
          {profileData.role === 'Client Poster' ? 'Company Overview:' : 'Bio:'}
        </label>
        {isEditing ? (
          <textarea
            value={profileData.bio}
            onChange={(e) => handleFieldChange('bio', e.target.value)}
            placeholder={
              profileData.role === 'Client Poster'
                ? 'Briefly describe your company or as a client'
                : 'Tell us about yourself'
            }
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-2 rounded-md min-h-[60px]">
            {profileData.bio ||
              (profileData.role === 'Client Poster' ? 'No company overview added' : 'No bio added')}
          </p>
        )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Location:</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="City, Country"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{profileData.location || 'Not specified'}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Email:</label>
          {isEditing ? (
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{profileData.email || 'Not provided'}</p>
          )}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-gray-700 mb-2 font-semibold">Phone:</label>
          {isEditing ? (
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{profileData.phone || 'Not provided'}</p>
          )}
        </div>

        {/* Freelancer-only: hourly rate */}
        {profileData.role !== 'Client Poster' && (
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Hourly Rate (ETH):</label>
            {isEditing ? (
              <input
                type="number"
                step="0.001"
                value={profileData.hourlyRate}
                onChange={(e) => handleFieldChange('hourlyRate', e.target.value)}
                placeholder="0.05"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
                {profileData.hourlyRate ? `${profileData.hourlyRate} ETH/hr` : 'Not specified'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Freelancer-only: experience + portfolio */}
      {profileData.role !== 'Client Poster' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Experience Level:</label>
            {isEditing ? (
              <select
                value={profileData.experienceLevel}
                onChange={(e) => handleFieldChange('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{profileData.experienceLevel}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Portfolio URL:</label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.portfolioUrl}
                onChange={(e) => handleFieldChange('portfolioUrl', e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
                {profileData.portfolioUrl ? (
                  <a
                    href={profileData.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {profileData.portfolioUrl}
                  </a>
                ) : (
                  'Not provided'
                )}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-gray-700 mb-2 font-semibold">LinkedIn URL:</label>
          {isEditing ? (
            <input
              type="url"
              value={profileData.linkedinUrl}
              onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
              {profileData.linkedinUrl ? (
                <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View LinkedIn
                </a>
              ) : (
                'Not provided'
              )}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-semibold">GitHub URL:</label>
          {isEditing ? (
            <input
              type="url"
              value={profileData.githubUrl}
              onChange={(e) => handleFieldChange('githubUrl', e.target.value)}
              placeholder="https://github.com/yourusername"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
              {profileData.githubUrl ? (
                <a href={profileData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View GitHub
                </a>
              ) : (
                'Not provided'
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 w-full">
        <p className="text-gray-700 mb-2">Wallet Balance:</p>
        {isLoadingBalance ? (
          <p className="font-semibold text-lg text-gray-500">Loading...</p>
        ) : balanceError ? (
          <div>
            <p className="font-semibold text-lg text-red-500 mb-2">Error loading balance</p>
            <p className="text-sm text-gray-600">{balanceError}</p>
            <button
              onClick={() => {
                setBalanceError(null);
                setIsLoadingBalance(true);
                const fetchBalance = async () => {
                  try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const balance = await provider.getBalance(account);
                    setBalance(ethers.utils.formatEther(balance));
                    setBalanceError(null);
                  } catch (error) {
                    setBalanceError('Failed to fetch balance. Check your network connection.');
                  } finally {
                    setIsLoadingBalance(false);
                  }
                };
                fetchBalance();
              }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : balance !== null ? (
          <p className="font-semibold text-lg text-blue-500">{parseFloat(balance).toFixed(4)} ETH</p>
        ) : (
          <p className="font-semibold text-lg text-gray-500">Not available</p>
        )}
      </div>

      {/* Freelancer-only: skills and past projects */}
      {profileData.role !== 'Client Poster' && (
        <>
          <div className="w-full mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Skills:</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.skills}
                onChange={(e) => handleFieldChange('skills', e.target.value)}
                placeholder="Enter your skills (comma separated)"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
                {profileData.skills || 'No skills listed'}
              </p>
            )}
          </div>

          <div className="w-full mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Past Projects:</label>
            {isEditing ? (
              <textarea
                value={profileData.projects}
                onChange={(e) => handleFieldChange('projects', e.target.value)}
                placeholder="Describe your past projects"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md min-h-[60px] whitespace-pre-wrap">
                {profileData.projects || 'No projects listed'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Client-only: company details */}
      {profileData.role === 'Client Poster' && (
        <div className="w-full mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Company / Client Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Company / Client Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  placeholder="Your company or client name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
                  {profileData.companyName || 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Company Website:</label>
              {isEditing ? (
                <input
                  type="url"
                  value={profileData.companyWebsite}
                  onChange={(e) => handleFieldChange('companyWebsite', e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-2 rounded-md">
                  {profileData.companyWebsite ? (
                    <a
                      href={profileData.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {profileData.companyWebsite}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">About the Company / Client:</label>
            {isEditing ? (
              <textarea
                value={profileData.companyDescription}
                onChange={(e) => handleFieldChange('companyDescription', e.target.value)}
                placeholder="Share details like industry, size, and type of projects you post."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-2 rounded-md min-h-[60px] whitespace-pre-wrap">
                {profileData.companyDescription || 'No company details added'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">
          Client Feedback &amp; Ratings (read-only):
        </label>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          {profileData.feedback && profileData.feedback.trim() ? (
            <div className="text-gray-700 whitespace-pre-wrap text-sm">
              {profileData.feedback}
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm text-center py-4">
              <p>No feedback received yet.</p>
              <p className="mt-2">Feedback and ratings are provided by clients after your work is completed.</p>
              <p className="mt-1">You cannot edit this section yourself.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Role:</label>
        {isEditing ? (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleFieldChange('role', 'Freelancer')}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                profileData.role === 'Freelancer' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Freelancer
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('role', 'Client Poster')}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                profileData.role === 'Client Poster' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Client Poster
            </button>
          </div>
        ) : (
          <p className="text-gray-700 bg-gray-50 p-2 rounded-md">{profileData.role}</p>
        )}
      </div>

      {/* Action Buttons - Properly aligned at bottom */}
      <div className="w-full border-t pt-6 mt-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                Save Profile
              </button>
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition-colors shadow-md"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="w-full sm:w-auto px-8 py-3 bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600 transition-colors shadow-md"
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={connectWallet}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            {account ? 'Change Account' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
