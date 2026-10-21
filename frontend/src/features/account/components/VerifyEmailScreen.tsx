import React from "react";
import { AuthScreen } from "./AuthScreen";

interface VerifyEmailScreenProps {
  onDone?: () => void;
  /** Allows the user to dismiss the verification card and return
   * to the previous view without signing out or breaking state. */
  onBack?: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ onDone, onBack }) => {
  return (
    <AuthScreen
      initialMode="verify"
      onVerified={onDone}
      onDismissVerify={onBack}
    />
  );
};