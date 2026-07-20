// features/account/pages/AccountPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../shared/components/layout/Navbar";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { useProfile } from "../hooks/useProfile";

import { AuthScreen } from "../components/AuthScreen";
import { Dashboard } from "../components/Dashboard";
import { ProfileEditor } from "../components/ProfileEditor";

const AccountPage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);

  const { updateProfile } = useProfile();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {!user ? (
        <AuthScreen onSignUp={signUp} onSignIn={signIn} />
      ) : isEditing ? (
        <ProfileEditor
          user={user}
          onCancel={() => setIsEditing(false)}
          onSave={updateProfile}
        />
      ) : (
        <Dashboard
          user={user}
          onSignOut={signOut}
          onNavigate={navigate}
          onEditProfile={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};

export default AccountPage;