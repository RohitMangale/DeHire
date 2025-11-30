// JobCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { daysLeft } from '../utils/index';
import { ethers } from 'ethers';

const JobCard = ({ job }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/job/${job.jobId}`);
    };

    const formatAccount = (msg) => {
        return `${msg.slice(0, 30)}...Read More`;
    };
    
    const remainingDays = daysLeft(job.deadline);
    // console.log(job.deadline);

    let formattedBudget;
    try {
        // Assuming job.budget is in ether and needs to be parsed to wei first
        formattedBudget = ethers.utils.formatEther(ethers.utils.parseUnits(job.budget.toString(), 18)); // 18 is the decimal places for Ether
    } catch (error) {
        console.error("Invalid budget value:", job.budget);
        formattedBudget = "0.00"; // Fallback value in case of error
    }

    // Convert to milliseconds (multiply by 1000)
    const date = new Date(job.deadline * 1000);

    // Format the date to a readable string
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',  
        timeZone: 'UTC' // You can change this to your local timezone if needed
    };

    const formattedDate = date.toLocaleString('en-US', options);

    console.log(formattedDate); 

    return (
        <div onClick={handleClick} className="bg-white cursor-pointer border w-[300px] border-gray-200 rounded-lg shadow-lg p-6 mb-6 transform transition duration-200 hover:scale-105 hover:shadow-1xl text-gray-500">
            <div className='flex h-[100%] flex-col gap-2'>
                <div className='h-[90%]'>
                    <img className="w-full h-40 object-cover rounded-md mb-4" src={job.image} alt="" />
                    <h2 className="text-md font-bold text-gray-800 mb-2">{job.title}</h2>
                    <p className="text-gray-600 font-normal mb-1"><strong>Description:</strong> {formatAccount(job.shortDescription)}</p>
                    <p className="text-gray-600 mb-1"><strong>Budget:</strong> {job.budget} ETH</p>
                    <p className="text-gray-600 mb-4"><strong>Deadline:</strong> {remainingDays} Day's Left </p>
                </div>
                <div className='h-[10%]'>
                    <button className="w-full bottom-1 bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
