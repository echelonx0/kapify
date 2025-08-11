// utils/profileErrorHandler.ts
export function handleProfileError(error: unknown, context: string, profileId?: string) {
  const timestamp = new Date().toISOString();

  // Ensure we extract useful info from any kind of error
  let message = "Unknown error";
  let stack = "";

  if (error instanceof Error) {
    message = error.message;
    stack = error.stack || "";
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = JSON.stringify(error);
  }

  const logEntry = {
    timestamp,
    context,         // e.g., "updateProfile", "fetchProfile"
    profileId: profileId || null,
    message,
    stack,
  };

  // Log to console (consistent formatting)
  console.error(`[ProfileError] ${context} | Profile ID: ${profileId || "N/A"}`, logEntry);

  // Optional: send to your error tracking service
  // sendToSentry(logEntry);
  // sendToFirebaseCrashlytics(logEntry);
}


// // utils/errorHandler.ts
// export function handleProfileError(error: unknown, context: string) {
//   let message = "An unknown error occurred.";

//   if (error instanceof Error) {
//     message = error.message;
//   } else if (typeof error === "string") {
//     message = error;
//   } else if (typeof error === "object" && error !== null && "message" in error) {
//     message = String((error as any).message);
//   }

//   // Log to console for debugging
//   console.error(`[Profile Error] (${context}):`, error);

//   // Optionally log to an external service
//   // logService.capture({ context, message, raw: error });

//   // Return a unified object to use in UI
//   return {
//     success: false,
//     context,
//     message,
//   };
// }
