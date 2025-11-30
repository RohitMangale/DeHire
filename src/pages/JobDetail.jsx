import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import Modal from 'react-modal';
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';

Modal.setAppElement('#root'); // Set the app root for accessibility

const JobDetail = ({ account }) => {
    const navigate = useNavigate();
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [previousWorkLink, setPreviousWorkLink] = useState("");
    const [projectLink, setProjectLink] = useState("");
    const [profile, setProfile] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null); // { isReviewed, isAccepted }
    const contractAddress = CONTRACT_ADDRESS;

    // Check if user has already applied to this job
    useEffect(() => {
        const checkIfApplied = async () => {
            if (!account || !contractAddress || !jobId) {
                setHasApplied(false);
                setApplicationStatus(null);
                return;
            }

            try {
                if (typeof window.ethereum !== 'undefined') {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

                    const applications = await contract.getApplications(jobId);
                    
                    // Check if current account has applied
                    const userApplication = applications.find(
                        app => app.applicant.toLowerCase() === account.toLowerCase()
                    );

                    if (userApplication) {
                        setHasApplied(true);
                        setApplicationStatus({
                            isReviewed: userApplication.isReviewed,
                            isAccepted: userApplication.isAccepted,
                        });
                    } else {
                        setHasApplied(false);
                        setApplicationStatus(null);
                    }
                }
            } catch (error) {
                console.error("Error checking application status:", error);
                setHasApplied(false);
                setApplicationStatus(null);
            }
        };

        checkIfApplied();
    }, [account, jobId, contractAddress]);

    // Fetch job details from contract
    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!contractAddress) {
                console.error('VITE_CONTRACT_ADDRESS is missing. Deploy the contract and update your .env file.');
                return;
            }
            try {
                if (typeof window.ethereum !== 'undefined') {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

                    const jobs = await contract.getJobs();
                    const jobData = jobs[jobId]; // Get the job at the specific jobId index
                    
                    if (jobData) {
                        // Check and convert BigNumber values correctly
                        const jobIdNum = jobData.jobId ? jobData.jobId.toNumber() : null;
                        const deadline = jobData.deadline ? jobData.deadline.toNumber() : null;

                        setJob({
                            jobId: jobIdNum,
                            jobPoster: jobData.jobPoster,
                            title: jobData.title,
                            shortDescription: jobData.shortDescription,
                            detailedDescription: jobData.detailedDescription,
                            budget: ethers.utils.formatEther(jobData.budget), // Convert from BigNumber to readable format
                            deadline: deadline ? new Date(deadline * 1000).toLocaleDateString() : 'No deadline',
                            image: jobData.image,
                            workUrl: jobData.workUrl,
                            isCompleted: jobData.isCompleted,
                            isApproved: jobData.isApproved,
                        });
                    } else {
                        console.error(`Job with ID ${jobId} not found`);
                    }
                }
            } catch (error) {
                console.error("Error fetching job details:", error);
            }
        };

        fetchJobDetails();
    }, [jobId, contractAddress]);

    // Prefill application details from saved profile (if available)
    const loadProfileForApplication = () => {
        try {
            if (!account) return;

            const savedProfile = localStorage.getItem(`profile_${account}`);
            if (!savedProfile) return;

            const parsed = JSON.parse(savedProfile);
            setProfile(parsed);

            // Pre-fill fields but keep them editable for this application
            setName(parsed.name || "");
            setPreviousWorkLink(parsed.portfolioUrl || "");
            setProjectLink(parsed.projects || "");
        } catch (err) {
            console.error("Error loading profile for application:", err);
        }
    };

    // Handle the "Apply" button to open the modal
    const handleApplyClick = () => {
        if (!account) {
            alert("Please connect your wallet and complete your profile before applying.");
            return;
        }

        loadProfileForApplication();
        setIsModalOpen(true);
    };

    // Close the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Submit application to smart contract
    const submitApplication = async () => {
        if (!name || !previousWorkLink || !projectLink) {
            alert("Please fill out all fields.");
            return;
        }

        try {
            if (!contractAddress) {
                alert('Smart contract address missing. Deploy via Truffle and set VITE_CONTRACT_ADDRESS.');
                return;
            }
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

                const tx = await contract.applyForJob(jobId, name, previousWorkLink, projectLink);
                await tx.wait(); // Wait for the transaction to be mined

                alert("Application submitted successfully!");
                closeModal();
                // Refresh application status by re-checking
                setHasApplied(true);
                setApplicationStatus({ isReviewed: false, isAccepted: false });
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Failed to submit application.");
        }
    };

    

    if (!job) return <p>Loading...</p>;

    return (
        <div className='pt-[100px]'>
            <div className="max-w-3xl mx-auto mt-8 px-4">
                <div onClick={() => navigate('/')} className='cursor-pointer p-2 border border-gray-500 rounded-full w-10 text-center font-semibold text-gray-700 mb-5'>
                    <div className="fa-solid fa-arrow-left" />
                </div>
                <img src={job.image} alt={job.title} className="w-full h-72 object-cover rounded-lg mb-6" />
                <div className='flex gap-2 mb-8'>
                    <div className='w-[60%]'>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
                        <p className="text-gray-700 mb-4"><strong>Short Description:</strong> {job.shortDescription}</p>
                        <p className="text-gray-700 mb-4"><strong>Detailed Description:</strong> {job.detailedDescription}</p>
                    </div>
                    <div className='w-[40%] flex flex-col gap-5'>
                        <div className='h-[50%]'>
                            <p className="text-gray-700 mb-4"><strong>Budget:</strong> {job.budget} ETH</p>
                            <p className="text-gray-700 mb-6"><strong>Deadline:</strong> {job.deadline}</p>
                        </div>
                        <div className='flex flex-col items-center justify-center gap-3 h-[10%]'>
                            {hasApplied ? (
                                <div className="w-full">
                                    {applicationStatus?.isAccepted ? (
                                        <div className="bg-green-100 border-2 border-green-500 text-green-800 p-3 rounded-md text-center font-semibold">
                                            ✅ Application Accepted!
                                        </div>
                                    ) : applicationStatus?.isReviewed ? (
                                        <div className="bg-red-100 border-2 border-red-500 text-red-800 p-3 rounded-md text-center font-semibold">
                                            Application Not Accepted
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-100 border-2 border-yellow-500 text-yellow-800 p-3 rounded-md text-center font-semibold">
                                            ⏳ Application Pending Review
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleApplyClick}
                                    className="bg-green-500 text-center w-full text-white p-2 rounded-md font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition"
                                >
                                    Apply for Job
                                </button>
                            )}
                            <Link
                                to={job.workUrl}
                                target='_blank'
                                className="bg-blue-500 text-white w-full p-2 rounded-md font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition text-center"
                            >
                                See Project Files
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Job Application Form */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Apply for Job"
                className="bg-white max-w-lg p-8 mx-auto my-16 rounded-lg shadow-lg outline-none"
            >
                <h2 className="text-2xl font-bold mb-4">Apply for {job.title}</h2>

                {profile && (
                    <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Your Profile (shared with client)</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    navigate('/Profile');
                                }}
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Edit full profile
                            </button>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                            <strong>Name:</strong> {profile.name || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                            <strong>Bio:</strong> {profile.bio || 'No bio added'}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                            <strong>Skills:</strong> {profile.skills || 'No skills listed'}
                        </p>
                        <p className="text-sm text-gray-700">
                            <strong>Portfolio:</strong>{" "}
                            {profile.portfolioUrl ? profile.portfolioUrl : 'Not provided'}
                        </p>
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                />
                <input
                    type="text"
                    placeholder="Link to Previous Work"
                    value={previousWorkLink}
                    onChange={(e) => setPreviousWorkLink(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                />
                <input
                    type="text"
                    placeholder="Project Link"
                    value={projectLink}
                    onChange={(e) => setProjectLink(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                />
                <button
                    onClick={submitApplication}
                    className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600"
                >
                    Submit Application
                </button>
                <button
                    onClick={closeModal}
                    className="ml-4 bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600"
                >
                    Cancel
                </button>
            </Modal>
        </div>
    );
};

export default JobDetail;
