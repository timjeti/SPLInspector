import { Connection } from '@solana/web3.js';

// Default Solana endpoint
//NOTE: ADD YOUR ENDPOINT HERE
const DEFAULT_ENDPOINT = "XXXX";
/**
 * Utility class for common functionalities.
 */
export class Utils {
  private static connection: Connection | null = null;

  // Get the Solana connection instance
  static getConnection(): Connection {
    if (!Utils.connection) {
      Utils.connection = new Connection(DEFAULT_ENDPOINT);
    }
    if (!Utils.connection) {
      throw new Error('Connection not initialized. Call initializeConnection() first.');
    }
    return Utils.connection;
  }

  // Delay execution for a specified number of milliseconds
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static  formatTimestampToUTC(timestamp?: number | null | undefined): Date {
    // Use the current time if no timestamp is provided
    const epoch = timestamp ?? Math.floor(Date.now() / 1000);
    
    // Create a Date object using the epoch timestamp (in milliseconds)
    const resDate = new Date(epoch * 1000); // Convert seconds to milliseconds
    return resDate;
    // Format the Date object to a kolkata string
    // const kolkataDateTime = date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    // return kolkataDateTime;
  }
}



