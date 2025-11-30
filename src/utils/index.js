export const daysLeft = (deadline) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeDiff = deadline - currentTime; // Difference in seconds
  
    const daysLeft = Math.floor(timeDiff / (60 * 60 * 24)); // Convert seconds to days
    return daysLeft > 0 ? daysLeft : 0; // Ensure it doesn't return negative days
  };
  
  
  export const calculateBarPercentage = (goal, raisedAmount) => {
    const percentage = Math.round((raisedAmount * 100) / goal);
  
    return percentage;
  };
  
  export const checkIfImage = (url, callback) => {
    const img = new Image();
    img.src = url;
  
    if (img.complete) callback(true);
  
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
  };
  