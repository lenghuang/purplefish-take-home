// license-validator.ts
// This file implements a simple license validation tool. It uses a Zod schema to ensure
// the input parameters (license number, expiry date, and state) match expected patterns
// and data types. If the validation passes, a mock validation logic is performed, returning
// a status indicating the license validity.

import { z } from 'zod';
import { Tool } from './tool-registry';

// Define a Zod schema for license validation parameters. It ensures:
// 1) licenseNumber has at least 6 alphanumeric characters (uppercase letters or digits).
// 2) expiryDate is a valid date object.
// 3) state is a non-empty string (e.g., "NY" or "CA").
const licenseSchema = z.object({
  licenseNumber: z.string().regex(/^[A-Z0-9]{6,}$/),
  expiryDate: z.coerce.date(),
  state: z.string().min(2),
});

// Example license validation tool. In a real application, you could connect to an external
// license check API or a local database to verify the license. For demonstration, this
// simply checks if the current date is before the expiryDate and returns a result.
export const licenseValidatorTool: Tool = {
  name: 'license-validator',
  description: 'Checks if a given license is valid based on number format and expiry date.',
  // The parameters property references our Zod schema for input validation.
  parameters: licenseSchema,
  // The execute function receives the validated inputs and returns a result.
  execute: async (params) => {
    const { licenseNumber, expiryDate, state } = params;

    // Mock logic: Check if license expires in the future.
    const now = new Date();
    let isValid = true;
    let resultMessage = 'License is valid.';

    // If the expiryDate has already passed, mark invalid.
    if (expiryDate.getTime() < now.getTime()) {
      isValid = false;
      resultMessage = 'License is expired.';
    }

    // Return the result object with short status and additional info.
    return {
      isValid,
      message: resultMessage,
      licenseNumber,
      state,
      expiryDate: expiryDate.toISOString(),
    };
  },
};
