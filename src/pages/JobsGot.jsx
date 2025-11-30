import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';

const JobsGot = () => {
  const [jobs, setJobs] = useState([]);
  const [account, setAccount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const contractAddress = CONTRACT_ADDRESS;

  const requestAccount = async () => {
    if (window.ethereum) {
      const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(selectedAccount);
    } else {
      console.error('Ethereum provider not found. Install MetaMask.');
    }
  };

  const fetchAcceptedJobs = async () => {
    setIsLoading(true);
    if (!contractAddress) {
      console.error('VITE_CONTRACT_ADDRESS is missing. Deploy the contract and set it in your .env file.');
      setIsLoading(false);
      return;
    }
    if (typeof window.ethereum === 'undefined' || !account) {
      setIsLoading(false);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

      // (jobs[], reviewed[], accepted[], jobIds[])
      const result = await contract.getAppliedJobsWithStatus(account);
      const jobsArray = result[0];
      const reviewedArray = result[1];
      const acceptedArray = result[2];
      const jobIdsArray = result[3];

      const formatted = jobsArray
        .map((job, index) => {
          if (!acceptedArray[index]) return null; // only jobs that were accepted

          const title = job.title || job[1];
          const shortDescription = job.shortDescription || job[2];
          const budgetWei = job.budget || job[4];
          const budget = budgetWei ? ethers.utils.formatEther(budgetWei.toString()) : '0';
          const deadline = job.deadline ? job.deadline.toNumber() : job[5]?.toNumber?.() || 0;
          const image = job.image || job[6];
          const workUrl = job.workUrl || job[7];

          const jobIdOnChain = jobIdsArray[index].toNumber();

          // Load any locally stored submitted work URL for this job & freelancer
          const submittedWorkKey = `submittedWork_${jobIdOnChain}_${account}`;
          const submittedWorkUrl = localStorage.getItem(submittedWorkKey) || '';

          return {
            localIndex: index,
            jobId: jobIdOnChain,
            title: title || 'Untitled Job',
            shortDescription: shortDescription || '',
            budget,
            deadline,
            image,
            workUrl,
            isReviewed: reviewedArray[index],
            isAccepted: acceptedArray[index],
            submittedWorkUrl,
            // Check if work has actually been submitted (even if contract says reviewed)
            hasWorkSubmitted: submittedWorkUrl && submittedWorkUrl.trim() !== '',
          };
        })
        .filter((job) => job !== null);

      setJobs(formatted);
    } catch (error) {
      console.error('Error fetching accepted jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWork = (job, workUrl) => {
    if (!workUrl || !workUrl.trim()) {
      alert('Please enter a work submission URL.');
      return;
    }

    // Basic URL validation
    try {
      new URL(workUrl.trim());
    } catch (e) {
      alert('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    const key = `submittedWork_${job.jobId}_${account}`;
    localStorage.setItem(key, workUrl.trim());

    // Dispatch custom event to notify other components (like ClientJobs)
    window.dispatchEvent(new CustomEvent('workSubmitted', {
      detail: { jobId: job.jobId, applicant: account, workUrl: workUrl.trim() }
    }));

    setJobs((prev) =>
      prev.map((j) =>
        j.jobId === job.jobId
          ? {
              ...j,
              submittedWorkUrl: workUrl.trim(),
            }
          : j
      )
    );
    alert('✅ Work submitted successfully! The client will be notified and can review it.');
  };

  useEffect(() => {
    requestAccount().catch((err) => console.error('Error requesting account:', err));
  }, []);

  useEffect(() => {
    fetchAcceptedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const formatDeadline = (deadlineSeconds) => {
    if (!deadlineSeconds) return 'N/A';
    const date = new Date(deadlineSeconds * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (isReviewed, isAccepted, hasWorkSubmitted) => {
    // If accepted but work not submitted yet, show "Accepted - Submit Work"
    if (isAccepted && !hasWorkSubmitted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          Accepted - Submit Work
        </span>
      );
    }
    
    if (isReviewed && isAccepted && hasWorkSubmitted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Completed & Paid
        </span>
      );
    } else if (isReviewed && !isAccepted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Not Accepted
        </span>
      );
    } else if (isAccepted && hasWorkSubmitted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Work Submitted - Awaiting Review
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          In Progress
        </span>
      );
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-[1250px] mx-auto px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Jobs You Got</h1>
          <p className="text-gray-600 text-lg">Manage and submit work for your accepted jobs</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading your accepted jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Accepted Jobs Yet</h3>
            <p className="text-gray-600">
              You don't have any accepted jobs yet. Keep applying and you'll see them here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <div
                key={`${job.jobId}-${job.localIndex}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Job Image */}
                {job.image && (
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img
                      src={job.image}
                      alt={job.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="mb-4">
                    {getStatusBadge(job.isReviewed, job.isAccepted, job.hasWorkSubmitted)}
                  </div>

                  {/* Job Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>

                  {/* Short Description */}
                  {job.shortDescription && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {job.shortDescription}
                    </p>
                  )}

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">💰</span>
                      <span className="text-gray-700">
                        <strong>Budget:</strong> {job.budget} ETH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">📅</span>
                      <span className="text-gray-700">
                        <strong>Deadline:</strong> {formatDeadline(job.deadline)}
                      </span>
                    </div>
                    {job.workUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">📋</span>
                        <span className="text-gray-700">
                          <strong>Project Brief:</strong>{' '}
                          <a
                            href={job.workUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submit Work Section - Show if accepted but work not submitted, or if work submitted but not reviewed yet */}
                  {job.isAccepted && (!job.hasWorkSubmitted || (job.hasWorkSubmitted && !job.isReviewed)) && (
                    <>
                      <div className="border-t border-gray-200 my-4"></div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-300">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">📤</span>
                          <h4 className="font-bold text-gray-900">
                            Submit Your Completed Work
                          </h4>
                        </div>

                        {job.submittedWorkUrl ? (
                          <div className="bg-white p-3 rounded-lg border-2 border-green-400 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-600">✅</span>
                              <p className="font-semibold text-green-800 text-sm">Work Submitted!</p>
                            </div>
                            <a
                              href={job.submittedWorkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline break-all block"
                            >
                              {job.submittedWorkUrl}
                            </a>
                            <p className="text-xs text-gray-500 mt-2 italic">You can update it below if needed.</p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                              <strong>⚠️ No work submitted yet.</strong> Please submit your completed work below.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Work Submission Link:
                            </label>
                            <input
                              type="url"
                              id={`work-url-got-${job.jobId}`}
                              defaultValue={job.submittedWorkUrl}
                              placeholder="https://your-completed-work-link.com"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            />
                            <p className="text-xs text-gray-600 mt-2">
                              💡 <strong>Tip:</strong> Submit a link to Google Drive, GitHub, your portfolio, or any publicly accessible work.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const input = document.getElementById(`work-url-got-${job.jobId}`);
                              handleSubmitWork(job, input.value);
                            }}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                          >
                            <span>📤</span>
                            <span>{job.submittedWorkUrl ? 'Update Submission' : 'Submit Work'}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Completed Status - Only show if work was submitted AND reviewed */}
                  {job.isReviewed && job.isAccepted && job.hasWorkSubmitted && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-semibold">
                          ✅ Work completed and payment received!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Accepted but no work submitted warning */}
                  {job.isAccepted && !job.hasWorkSubmitted && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-semibold mb-1">
                          ⚠️ Your application was accepted!
                        </p>
                        <p className="text-xs text-yellow-700">
                          Please submit your completed work above. The client is waiting for your submission.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsGot;
