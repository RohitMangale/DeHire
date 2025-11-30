import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../Web3/FreelanceMarketplace.json';
import { CONTRACT_ADDRESS } from '../config/web3';
import EditJob from './EditJob';

const JobCard_FC = ({ job, account, onFeedbackSubmitted, onJobUpdated }) => {
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submittedWorkUrl, setSubmittedWorkUrl] = useState('');
    
    // Fallback values in case any job data is missing
    const jobImage = job.image || 'https://via.placeholder.com/300x200.png?text=No+Image';
    const jobBudget = job.budget ? `${job.budget} ETH` : 'Not available';
    const jobTitle = job.title || 'Untitled Job';
    const hasAcceptedApplication = job.acceptedApplication && job.acceptedApplication.isAccepted;

    // Load submitted work URL from localStorage and listen for updates
    useEffect(() => {
        if (!hasAcceptedApplication || !job.acceptedApplication) return;

        const loadSubmittedWork = () => {
            const applicantAddress = job.acceptedApplication.applicant;
            if (!applicantAddress) return;

            // Try multiple key formats
            const keysToTry = [
                `submittedWork_${job.jobId}_${applicantAddress}`,
                `submittedWork_${job.jobId}_${applicantAddress.toLowerCase()}`,
            ];

            let foundUrl = '';
            for (const key of keysToTry) {
                const url = localStorage.getItem(key);
                if (url && url.trim()) {
                    foundUrl = url.trim();
                    break;
                }
            }

            // Also check all localStorage keys matching the pattern
            if (!foundUrl) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('submittedWork_') && key.includes(applicantAddress)) {
                        const keyParts = key.split('_');
                        if (keyParts.length >= 3) {
                            const keyJobId = keyParts[1];
                            if (keyJobId === String(job.jobId)) {
                                foundUrl = localStorage.getItem(key) || '';
                                if (foundUrl) break;
                            }
                        }
                    }
                }
            }

            setSubmittedWorkUrl(foundUrl);
        };

        // Load initially
        loadSubmittedWork();

        // Listen for storage changes
        const handleStorageChange = (e) => {
            if (e.key && e.key.startsWith('submittedWork_')) {
                loadSubmittedWork();
            }
        };

        // Listen for custom workSubmitted event
        const handleWorkSubmitted = () => {
            loadSubmittedWork();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('workSubmitted', handleWorkSubmitted);

        // Also check periodically (every 10 seconds) - less frequent to avoid constant refreshing
        const intervalId = setInterval(loadSubmittedWork, 10000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('workSubmitted', handleWorkSubmitted);
            clearInterval(intervalId);
        };
    }, [job.jobId, job.acceptedApplication, hasAcceptedApplication]);

    // Use submittedWorkUrl from state if available, otherwise fall back to prop
    const displaySubmittedWorkUrl = submittedWorkUrl || (job.acceptedApplication?.submittedWorkUrl || '');

    const handleSubmitFeedback = async () => {
        if (!feedback.trim()) {
            alert('Please enter feedback before submitting.');
            return;
        }

        if (!hasAcceptedApplication || !account) {
            alert('No accepted application found or account not connected.');
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            // Store feedback in localStorage with key: feedback_<jobId>_<applicantAddress>
            const feedbackKey = `feedback_${job.jobId}_${job.acceptedApplication.applicant}`;
            const feedbackData = {
                jobId: job.jobId,
                jobTitle: job.title,
                applicant: job.acceptedApplication.applicant,
                applicantName: job.acceptedApplication.name,
                feedback: feedback.trim(),
                rating: rating,
                submittedAt: new Date().toISOString(),
                submittedBy: account,
            };
            
            localStorage.setItem(feedbackKey, JSON.stringify(feedbackData));
            
            // Also update the freelancer's profile feedback (append to existing)
            const applicantAddress = job.acceptedApplication.applicant;
            
            // Try to find existing profile with case-insensitive search
            let freelancerProfileKey = `profile_${applicantAddress}`;
            let existingProfile = localStorage.getItem(freelancerProfileKey);
            
            // Try lowercase if not found
            if (!existingProfile) {
                freelancerProfileKey = `profile_${applicantAddress.toLowerCase()}`;
                existingProfile = localStorage.getItem(freelancerProfileKey);
            }
            
            // Search all localStorage keys if still not found
            if (!existingProfile) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('profile_')) {
                        const addressFromKey = key.replace('profile_', '');
                        if (addressFromKey.toLowerCase() === applicantAddress.toLowerCase()) {
                            freelancerProfileKey = key;
                            existingProfile = localStorage.getItem(key);
                            break;
                        }
                    }
                }
            }
            
            try {
                let profile = {};
                if (existingProfile) {
                    profile = JSON.parse(existingProfile);
                }
                
                const existingFeedback = profile.feedback || '';
                // Format feedback with date and rating
                const date = new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const stars = '⭐'.repeat(rating);
                const newFeedbackEntry = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 Job: ${job.title}\n⭐ Rating: ${rating}/5 ${stars}\n📅 Date: ${date}\n💬 Feedback:\n${feedback.trim()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                profile.feedback = existingFeedback + newFeedbackEntry;
                
                // Save the updated profile
                localStorage.setItem(freelancerProfileKey, JSON.stringify(profile));
                console.log('Feedback saved to profile:', freelancerProfileKey);
                console.log('Updated feedback:', profile.feedback);
                
                // Dispatch event to notify profile page (with both original and lowercase address)
                window.dispatchEvent(new CustomEvent('feedbackSubmitted', {
                    detail: { 
                        applicant: applicantAddress,
                        applicantLower: applicantAddress.toLowerCase(),
                        jobId: job.jobId 
                    }
                }));
                
                // Also trigger storage event manually for same-tab updates
                window.dispatchEvent(new StorageEvent('storage', {
                    key: freelancerProfileKey,
                    newValue: JSON.stringify(profile)
                }));
            } catch (e) {
                console.error('Error updating freelancer profile feedback:', e);
                alert('Error saving feedback to profile: ' + e.message);
                setIsSubmittingFeedback(false);
                return;
            }

            alert('Feedback submitted successfully!');
            setFeedback('');
            setRating(5);
            
            if (onFeedbackSubmitted) {
                onFeedbackSubmitted();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    return (
        <div className="border w-full max-w-md p-4 rounded-lg shadow-sm bg-white">
            <div className="flex flex-col gap-3">
                <div>
                    <img 
                        src={jobImage} 
                        alt={jobTitle} 
                        className="w-full h-32 object-cover mb-4 rounded" 
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{jobTitle}</h3>
                    <p className="text-gray-700 text-sm">{job.shortDescription}</p>
                    <p className="text-gray-700 mt-2 text-sm"><strong>Budget:</strong> {jobBudget}</p>
                </div>

                {/* Edit button - only show if job is not completed/approved */}
                {!job.isCompleted && !job.isApproved && (
                    <div className="mb-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 text-sm font-medium"
                        >
                            Edit Job
                        </button>
                    </div>
                )}

                {hasAcceptedApplication ? (
                    <div className="border-t pt-3 mt-2">
                        <div className="mb-3">
                            <h4 className="font-semibold text-green-700 mb-2">✓ Accepted Application</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                <p><strong>Freelancer:</strong> {job.acceptedApplication.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-600 break-all">
                                    <strong>Wallet:</strong> {job.acceptedApplication.applicant}
                                </p>
                                {job.acceptedApplication.profile && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs"><strong>Bio:</strong> {job.acceptedApplication.profile.bio || 'N/A'}</p>
                                        <p className="text-xs"><strong>Skills:</strong> {job.acceptedApplication.profile.skills || 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submitted Work Section */}
                        <div className="mb-3">
                            {displaySubmittedWorkUrl ? (
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-green-600 text-lg">✅</span>
                                        <h4 className="font-semibold text-green-800">Work Submitted!</h4>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">The freelancer has submitted their completed work. Please review it below.</p>
                                    <a
                                        href={displaySubmittedWorkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium break-all bg-white px-3 py-2 rounded border border-blue-200"
                                    >
                                        <span>🔗</span>
                                        <span>View Submitted Work</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-600">⏳</span>
                                        <p className="text-sm text-yellow-800">
                                            <strong>Waiting for work submission...</strong>
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        The freelancer has not submitted their work yet. They will submit it when ready.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Review & Feedback Section - Only show if work is submitted */}
                        {displaySubmittedWorkUrl && (
                            <div className="border-t pt-4 mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span>⭐</span>
                                    <span>Review & Provide Feedback</span>
                                </h4>
                                <p className="text-xs text-gray-600 mb-3">
                                    After reviewing the submitted work, please provide your feedback and rating below.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rating (1-5 stars):
                                        </label>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            {[1, 2, 3, 4, 5].map(r => {
                                                // Display stars correctly: 1 star = ⭐, 2 stars = ⭐⭐, etc.
                                                const stars = '⭐'.repeat(r);
                                                return (
                                                    <option key={r} value={r}>
                                                        {r} {r === 1 ? 'star' : 'stars'} - {stars}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Your Feedback:
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Share your thoughts on the completed work. What did you like? Any suggestions for improvement?"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="4"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={isSubmittingFeedback || !feedback.trim()}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingFeedback ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✓</span>
                                                <span>Submit Feedback</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <Link
                            to={`/yourjobs/job-review/${job.jobId}`}
                            className="mt-2 inline-block bg-blue-500 w-full text-center text-white py-2 px-4 rounded hover:bg-blue-600 text-sm"
                            title="Review applications for this job"
                        >
                            Review Applications
                        </Link>
                    </div>
                )}

                {/* Edit Job Modal */}
                {isEditModalOpen && (
                    <EditJob
                        job={job}
                        closeModal={() => setIsEditModalOpen(false)}
                        onJobUpdated={() => {
                            setIsEditModalOpen(false);
                            if (onJobUpdated) {
                                onJobUpdated();
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default JobCard_FC;
