import React, { useState } from 'react';

function EtherForm() {
    const [amount, setAmount] = useState('');

    const handleInputChange = (e) => {
        let value = e.target.value;
        
        // Convert the input value to a float for validation
        let etherAmount = parseFloat(value);

        // Check if input is a valid number and above 0.00001
        if (isNaN(etherAmount) || etherAmount < 0.00001) {
            etherAmount = 0.00001;
        }

        // Update the state with the validated value
        setAmount(etherAmount.toString());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Entered Ether amount:", amount);
        // Placeholder for sending to a contract
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Enter Ether Amount</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="amount">Amount (ETH):</label>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount in Ether"
                    step="0.00001"  // Allows small float increments
                    min="0.00001"  // Sets minimum acceptable value
                    style={{ padding: '8px', width: '100%', margin: '10px 0' }}
                />
                <button type="submit" style={{ padding: '10px', width: '100%' }}>Submit</button>
            </form>
        </div>
    );
}

export default EtherForm;
