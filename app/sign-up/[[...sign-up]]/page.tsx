import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#07071a" }}
    >
      <SignUp />
    </div>
  );
}
