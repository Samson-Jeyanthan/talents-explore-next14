import Signin from "../sign-in/page";
import { ForgotPasswordModal } from "@/components/modals";

const ForgotPassword = () => {
  return (
    <div className="flex-center w-full text-light-900">
      <Signin />
      <ForgotPasswordModal />
    </div>
  );
};

export default ForgotPassword;
