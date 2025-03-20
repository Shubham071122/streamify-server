
export const getExpiryDate = (expiryString) => {
    const timeUnit = expiryString.slice(-1); // Get the last character (s, m, h, d)
    const timeValue = parseInt(expiryString, 10); // Get the numeric value
  
    if (isNaN(timeValue)) {
      throw new Error("Invalid expiry format in ENV");
    }
  
    let multiplier;
    switch (timeUnit) {
      case "s": multiplier = 1000; break;                  // Seconds
      case "m": multiplier = 1000 * 60; break;             // Minutes
      case "h": multiplier = 1000 * 60 * 60; break;        // Hours
      case "d": multiplier = 1000 * 60 * 60 * 24; break;   // Days
      default: throw new Error("Unsupported time unit in expiry format");
    }
  
    return new Date(Date.now() + timeValue * multiplier);
  };
  