import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';
import blockies from 'ethereum-blockies-base64';

const JobReview = ({ account }) => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'accepted', 'denied'
    const contractAddress = CONTRACT_ADDRESS;
    const [balance, setBalance] = useState(null);

    // Fetch job details
    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!contractAddress) return;
            try {
                if (typeof window.ethereum !== 'undefined') {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
                    const jobs = await contract.getJobs();
                    const jobData = jobs[jobId];
                    if (jobData) {
                        setJob({
                            title: jobData.title,
                            budget: ethers.utils.formatEther(jobData.budget),
                            image: jobData.image,
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching job details:", error);
            }
        };
        fetchJobDetails();
    }, [jobId, contractAddress]);

    const fetchApplications = async () => {
        setIsLoading(true);
        if (!contractAddress) {
            console.error('VITE_CONTRACT_ADDRESS is missing. Deploy the contract and set it in your .env file.');
            setIsLoading(false);
            return;
        }
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

            try {
                const applicationsArray = await contract.getApplications(jobId);
                const formattedApplications = applicationsArray.map(app => ({
                    applicant: app.applicant,
                    name: app.name,
                    previousWorkLink: app.previousWorkLink,
                    projectLink: app.projectLink,
                    isReviewed: app.isReviewed,
                    isAccepted: app.isAccepted,
                }));

                // Enrich each application with the stored profile snapshot (if available)
                const enriched = formattedApplications.map(app => {
                    try {
                        if (!app.applicant) return app;

                        // Load stored profile for this applicant (if any)
                        const savedProfile = localStorage.getItem(`profile_${app.applicant}`);
                        const profile = savedProfile ? JSON.parse(savedProfile) : null;

                        // Load any submitted work URL for this job/applicant pair
                        const submittedWorkKey = `submittedWork_${jobId}_${app.applicant}`;
                        const submittedWorkUrl = localStorage.getItem(submittedWorkKey) || '';

                        return {
                            ...app,
                            profile,
                            submittedWorkUrl,
                        };
                    } catch (e) {
                        console.error('Error reading stored profile for applicant', app.applicant, e);
                        return app;
                    }
                });

                setApplications(enriched);
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchBalance = async () => {
            if (account && window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const balance = await provider.getBalance(account);
                setBalance(ethers.utils.formatEther(balance));
            }
        };

        fetchBalance();
    }, [account]);

    const handleApproveApplication = async (applicationIndex) => {
        if (typeof window.ethereum !== 'undefined') {
            if (!contractAddress) {
                alert('Smart contract address missing. Deploy via Truffle and set VITE_CONTRACT_ADDRESS.');
                return;
            }
            if (!ethers.utils.isAddress(contractAddress)) {
                alert(`Invalid contract address: ${contractAddress}`);
                return;
            }
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
    
            try {
                const account = await signer.getAddress();
                console.log("Connected account:", account);
                console.log("Contract address:", contractAddress);
                
                const contractCode = await provider.getCode(contractAddress);
                if (contractCode === '0x') {
                    throw new Error(`No contract found at address ${contractAddress}. Please verify the contract is deployed.`);
                }
                console.log("Contract code verified");
    
                const application = applications[applicationIndex];
                if (!application) {
                    alert('Application not found');
                    return;
                }
                const applicantAddress = application.applicant;
                console.log("Applicant address:", applicantAddress);
    
                const jobBudget = await contract.getJobBudget(jobId);
                console.log(`Job Budget: ${ethers.utils.formatEther(jobBudget)} ETH`);
    
                const submittedKey = `submittedWork_${jobId}_${application.applicant}`;
                const workUrl = localStorage.getItem(submittedKey) || application.projectLink || "";
                
                const contractBalance = await provider.getBalance(contractAddress);
                const requiredBalance = jobBudget;
                console.log('Contract balance:', ethers.utils.formatEther(contractBalance), 'ETH');
                console.log('Required balance:', ethers.utils.formatEther(requiredBalance), 'ETH');
                
                if (contractBalance.lt(requiredBalance)) {
                    console.log('Contract needs funding. Sending ETH to contract...');
                    
                    try {
                        const gasEstimate = await provider.estimateGas({
                            to: contractAddress,
                            value: requiredBalance,
                            from: account
                        });
                        console.log('Estimated gas for funding:', gasEstimate.toString());
                        
                        const gasPrice = await provider.getGasPrice();
                        console.log('Gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');
                        
                        const userBalance = await provider.getBalance(account);
                        const totalCost = requiredBalance.add(gasEstimate.mul(gasPrice));
                        console.log('User balance:', ethers.utils.formatEther(userBalance), 'ETH');
                        console.log('Total cost (value + gas):', ethers.utils.formatEther(totalCost), 'ETH');
                        
                        if (userBalance.lt(totalCost)) {
                            throw new Error(`Insufficient funds. You need ${ethers.utils.formatEther(totalCost)} ETH but have ${ethers.utils.formatEther(userBalance)} ETH.`);
                        }
                        
                        const fundTx = await signer.sendTransaction({
                            to: contractAddress,
                            value: requiredBalance,
                            gasLimit: gasEstimate.mul(120).div(100),
                            gasPrice: gasPrice
                        });
                        console.log('Funding transaction sent:', fundTx.hash);
                        await fundTx.wait();
                        console.log('Contract funded successfully');
                    } catch (fundError) {
                        console.error('Error funding contract:', fundError);
                        throw new Error(`Failed to fund contract: ${fundError.message || 'Unknown error'}`);
                    }
                }
                
                try {
                    const reviewGasEstimate = await contract.estimateGas.reviewWork(
                        jobId, 
                        applicationIndex, 
                        true, 
                        workUrl
                    );
                    console.log('Estimated gas for reviewWork:', reviewGasEstimate.toString());
                    
                    const tx = await contract.reviewWork(jobId, applicationIndex, true, workUrl, {
                        gasLimit: reviewGasEstimate.mul(120).div(100)
                    });
                    console.log('Review transaction sent:', tx.hash);
                    await tx.wait();
                    console.log('Application approved and payment sent via contract');
                    alert("Application approved and payment sent successfully!");
                    fetchApplications();
                } catch (reviewError) {
                    console.error('Error in reviewWork:', reviewError);
                    if (reviewError.message && reviewError.message.includes('Payment failed')) {
                        throw new Error('Contract does not have sufficient balance. Please ensure contract is funded.');
                    }
                    throw reviewError;
                }
            } catch (error) {
                console.error("Error approving application:", error);
                let friendlyMessage = "Failed to approve and send payment.\n\n";

                if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                    alert("You cancelled the transaction in MetaMask.\n\nThe application was not changed.");
                    return;
                }

                const raw = error?.data?.message || error?.error?.message || error?.reason || error?.message || '';

                if (raw.includes('Application already reviewed')) {
                    friendlyMessage += "This application has already been reviewed.";
                } else if (raw.includes('Only job poster can review')) {
                    friendlyMessage += "You are not the job poster for this job. Switch to the account that posted the job and try again.";
                } else if (raw.includes('Invalid job ID')) {
                    friendlyMessage += "The job ID is invalid on-chain. This can happen if the contract was redeployed and the UI is using an old job index.";
                } else if (raw.includes('Invalid application index')) {
                    friendlyMessage += "The selected application index does not exist for this job.";
                } else if (raw.includes('Payment failed')) {
                    friendlyMessage += "The contract could not transfer payment to the freelancer (payment failed). Make sure the contract has enough balance and try again.";
                } else if (raw.includes('insufficient funds')) {
                    friendlyMessage += "Your account does not have enough ETH to cover payment + gas.";
                } else if (raw.includes('revert')) {
                    friendlyMessage += "The transaction was reverted by the contract. Check that you are the job poster, the application is still pending review, and the contract is correctly funded.";
                } else if (raw) {
                    friendlyMessage += raw;
                } else {
                    friendlyMessage += "Unknown error occurred. Check console for technical details.";
                }
                
                alert(friendlyMessage);
            }
        }
    };

    const handleDenyApplication = async (applicationIndex) => {
        if (typeof window.ethereum !== 'undefined') {
            if (!contractAddress) {
                alert('Smart contract address missing. Deploy via Truffle and set VITE_CONTRACT_ADDRESS.');
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

            try {
                const tx = await contract.reviewWork(jobId, applicationIndex, false, "", {
                    gasLimit: 300000
                });
                console.log('Deny transaction sent:', tx.hash);
                await tx.wait();
                console.log("Application denied.");
                alert("Application denied successfully!");
                fetchApplications();
            } catch (error) {
                console.error("Error denying application:", error);
                if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                    alert("You cancelled the transaction in MetaMask.\n\nThe application was not changed.");
                    return;
                }

                let errorMessage = "Failed to deny application. ";
                
                if (error.message) {
                    if (error.message.includes('already reviewed')) {
                        errorMessage += "This application has already been reviewed.";
                    } else if (error.message.includes('revert')) {
                        errorMessage += "The transaction was reverted by the contract. Double-check that you are the job poster and that this application can still be updated.";
                    } else {
                        errorMessage += error.message;
                    }
                } else {
                    errorMessage += "Unknown error occurred. Check console for details.";
                }
                
                alert(errorMessage);
            }
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [jobId]);

    const getStatusBadge = (isReviewed, isAccepted) => {
        if (isAccepted) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Accepted
                </span>
            );
        } else if (isReviewed) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Not Accepted
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Pending Review
                </span>
            );
        }
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const filteredApplications = applications.filter(app => {
        if (filterStatus === 'pending') return !app.isReviewed;
        if (filterStatus === 'accepted') return app.isAccepted;
        if (filterStatus === 'denied') return app.isReviewed && !app.isAccepted;
        return true; // 'all'
    });

    return (
        <div className="pt-24 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-[1250px] mx-auto px-6 pb-12">
                {/* Header */}
                <div className="mb-8">
                            <button
                        onClick={() => navigate('/yourjobs')}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                        <span className="text-xl">←</span>
                        <span>Back to My Jobs</span>
                            </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Review Applications
                            </h1>
                            {job && (
                                <p className="text-xl text-gray-600">
                                    {job.title}
                                </p>
                            )}
                        </div>
                        {balance && (
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Your Balance</p>
                                <p className="text-lg font-semibold text-blue-600">{parseFloat(balance).toFixed(4)} ETH</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats and Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                                <div className="text-sm text-gray-600">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {applications.filter(a => !a.isReviewed).length}
                                </div>
                                <div className="text-sm text-gray-600">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {applications.filter(a => a.isAccepted).length}
                                </div>
                                <div className="text-sm text-gray-600">Accepted</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'pending', 'accepted', 'denied'].map(status => (
                            <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                        filterStatus === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600">Loading applications...</p>
                        </div>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                            {filterStatus === 'all' ? 'No Applications Yet' : `No ${filterStatus} applications`}
                        </h3>
                        <p className="text-gray-600">
                            {filterStatus === 'all' 
                                ? 'No one has applied to this job yet.' 
                                : `There are no ${filterStatus} applications to display.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredApplications.map((app, index) => {
                            const originalIndex = applications.findIndex(a => a.applicant === app.applicant);
                            const avatar = app.applicant ? blockies(app.applicant) : null;
                            
                            return (
                                <div 
                                    key={originalIndex} 
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                {avatar && (
                                                    <img 
                                                        src={avatar} 
                                                        alt="Avatar" 
                                                        className="w-16 h-16 rounded-full border-2 border-gray-200"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {app.name || app.profile?.name || 'Unnamed Applicant'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-mono">
                                                        {formatAddress(app.applicant)}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(app.isReviewed, app.isAccepted)}
                                        </div>
                                    </div>

                                    {/* Profile Info */}
                                    {app.profile && (
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <span>👤</span> Profile Information
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {app.profile.bio && (
                                                    <div className="col-span-2">
                                                        <span className="font-medium text-gray-700">Bio:</span>
                                                        <p className="text-gray-600 mt-1">{app.profile.bio}</p>
                                                    </div>
                                                )}
                                                {app.profile.skills && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">Skills:</span>
                                                        <p className="text-gray-600 mt-1">{app.profile.skills}</p>
                                                    </div>
                                                )}
                                                {app.profile.experienceLevel && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">Experience:</span>
                                                        <p className="text-gray-600 mt-1">{app.profile.experienceLevel}</p>
                                                    </div>
                                                )}
                                                {app.profile.hourlyRate && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">Rate:</span>
                                                        <p className="text-gray-600 mt-1">{app.profile.hourlyRate} ETH/hr</p>
                                                    </div>
                                                )}
                                                {app.profile.location && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">Location:</span>
                                                        <p className="text-gray-600 mt-1">{app.profile.location}</p>
                                                    </div>
                                                )}
                                                {app.profile.portfolioUrl && (
                                                    <div className="col-span-2">
                                                        <span className="font-medium text-gray-700">Portfolio:</span>
                                                        <a
                                                            href={app.profile.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline block mt-1 truncate"
                                                        >
                                                            {app.profile.portfolioUrl}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Application Links */}
                                    <div className="p-6 space-y-3">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <span>🔗</span> Application Links
                                        </h4>
                                        <div className="space-y-2">
                                            {app.previousWorkLink && (
                                                <a
                                                    href={app.previousWorkLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm p-2 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    <span>📄</span>
                                                    <span>Previous Work</span>
                                                    <span className="ml-auto">↗</span>
                                                </a>
                                            )}
                                            {app.projectLink && (
                                                <a
                                                    href={app.projectLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm p-2 rounded-md hover:bg-blue-50 transition-colors"
                                                >
                                                    <span>💼</span>
                                                    <span>Project Proposal</span>
                                                    <span className="ml-auto">↗</span>
                                                </a>
                                            )}
                                            {app.submittedWorkUrl && (
                                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <p className="text-xs font-semibold text-green-800 mb-1">✅ Submitted Work</p>
                                                    <a
                                                        href={app.submittedWorkUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-700 hover:text-green-900 hover:underline text-sm flex items-center gap-2"
                                                    >
                                                        <span>{app.submittedWorkUrl}</span>
                                                        <span>↗</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!app.isReviewed && (
                                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                                            <button
                                                onClick={() => handleApproveApplication(originalIndex)}
                                                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <span>✓</span>
                                                <span>Approve & Pay</span>
                                            </button>
                                            <button
                                                onClick={() => handleDenyApplication(originalIndex)}
                                                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <span>✗</span>
                                                <span>Deny</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobReview;
