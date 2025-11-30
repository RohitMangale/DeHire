import { Link } from "react-router-dom";
import PostJob from "./PostJob";
import { useState } from "react";
import JobList from "./JobListing";

function Home({ account }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Hero Section */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center pt-24 pb-16">
                <div className="max-w-[1250px] w-full px-6">
                    <div className="flex flex-col items-center justify-center text-center mb-16">
                        <div className="mb-8">
                            <h1 className="font-bold text-blue-950 text-5xl md:text-7xl mb-4">
                                Welcome to <span className="text-blue-600">De<span className="text-indigo-600">H</span>ire</span>
                            </h1>
                            <p className="text-xl md:text-2xl font-medium text-gray-700 max-w-3xl mx-auto mt-6">
                                The decentralized freelance marketplace where talent meets opportunity. 
                                Built on blockchain for transparency, security, and trust.
                            </p>
                        </div>
                        <div className="mt-10 flex flex-wrap items-center gap-6 justify-center">
                            <button
                                onClick={openModal}
                                className="px-8 py-4 text-white bg-blue-600 font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Post a Job
                            </button>
                            <Link
                                to="/find-job"
                                className="px-8 py-4 text-blue-600 bg-white border-2 border-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Find Jobs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-white">
                <div className="max-w-[1250px] mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
                        Why Choose <span className="text-blue-600">De<span className="text-indigo-600">H</span>ire</span>?
                    </h2>
                    <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                        Experience the future of freelance work with blockchain-powered solutions
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h3>
                            <p className="text-gray-700">
                                All payments are processed through smart contracts on the blockchain, ensuring secure and transparent transactions without intermediaries.
                            </p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Transactions</h3>
                            <p className="text-gray-700">
                                Get paid instantly in ETH once your work is approved. No waiting periods, no payment delays - just fast, reliable payments.
                            </p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">🌐</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Global Reach</h3>
                            <p className="text-gray-700">
                                Connect with clients and freelancers from around the world. No geographical boundaries, just opportunities.
                            </p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Reviews</h3>
                            <p className="text-gray-700">
                                Build your reputation with verified reviews and ratings. Every interaction is recorded on the blockchain for complete transparency.
                            </p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">💼</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Control</h3>
                            <p className="text-gray-700">
                                Manage your profile, portfolio, and projects all in one place. You own your data and your work.
                            </p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Fees</h3>
                            <p className="text-gray-700">
                                No platform fees, no hidden costs. You keep 100% of what you earn. Only pay minimal gas fees for transactions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-[1250px] mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                        Get started in three simple steps
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                                1
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Profile</h3>
                            <p className="text-gray-700">
                                Sign up with MetaMask, build your profile showcasing your skills, experience, and portfolio. Set your rates and preferences.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                                2
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Find or Post Jobs</h3>
                            <p className="text-gray-700">
                                Browse available opportunities or post your project. Apply with your portfolio and proposal, or review applications from talented freelancers.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                                3
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Paid Securely</h3>
                            <p className="text-gray-700">
                                Complete the work, submit for review, and receive instant payment in ETH once approved. All transactions are secure and transparent.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-16 bg-blue-600 text-white">
                <div className="max-w-[1250px] mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">100%</div>
                            <div className="text-blue-100">Secure</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">0%</div>
                            <div className="text-blue-100">Platform Fees</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-blue-100">Available</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">∞</div>
                            <div className="text-blue-100">Possibilities</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-[1250px] mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                        Join thousands of freelancers and clients building the future of work on the blockchain
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={openModal}
                            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Post Your First Job
                        </button>
                        <Link
                            to="/find-job"
                            className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Explore Opportunities
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Jobs Section */}
            <div className="py-20 bg-white">
                <div className="max-w-[1250px] mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
                        Featured Jobs
                    </h2>
                    <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                        Discover exciting opportunities waiting for you
                    </p>
                    <JobList limit={4} account={account} />
                </div>
            </div>

            {isModalOpen && <PostJob closeModal={closeModal} />}
        </>
    );
}

export default Home;
