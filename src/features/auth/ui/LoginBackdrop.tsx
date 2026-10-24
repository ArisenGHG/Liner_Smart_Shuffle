import backdropMark from "@/assets/login-backdrop.svg";

export function LoginBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-5xl bg-login-backdrop">
      <div className="absolute -left-[15%] -top-[25%] h-[70%] w-[50%] rounded-full bg-login-glow opacity-[0.22] blur-[140px]" />
      <div className="absolute -right-[15%] top-[10%] h-[80%] w-[40%] rounded-full bg-login-glow-secondary opacity-[0.18] blur-[140px]" />
      <div className="absolute -bottom-[35%] left-[25%] h-[60%] w-[55%] rounded-full bg-login-glow opacity-[0.2] blur-[140px]" />
      <img
        src={backdropMark}
        alt=""
        aria-hidden="true"
        width={1200}
        height={780}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

export default LoginBackdrop;
