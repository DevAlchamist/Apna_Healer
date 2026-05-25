"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FormEvent } from "react";

type LandingJoinModalProps = {
  open: boolean;
  onClose: () => void;
  modalMethod: "email" | "phone";
  onModalMethodChange: (method: "email" | "phone") => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  otpCode: string;
  onOtpCodeChange: (value: string) => void;
  isOtpStage: boolean;
  isSigningIn: boolean;
  onGoogleSignIn: () => void;
  onPhoneSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOtpSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingJoinModal({
  open,
  onClose,
  modalMethod,
  onModalMethodChange,
  phoneNumber,
  onPhoneNumberChange,
  otpCode,
  onOtpCodeChange,
  isOtpStage,
  isSigningIn,
  onGoogleSignIn,
  onPhoneSubmit,
  onOtpSubmit,
}: LandingJoinModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-[#f4f4f2]/45 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[540px] rounded-[24px] border border-black/5 bg-white px-8 py-7 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-center text-[34px] font-semibold text-[#2f745f]">ApnaHealer</p>
              <button
                type="button"
                aria-label="Close join modal"
                onClick={onClose}
                disabled={isSigningIn}
                className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-[#9ca4a2] transition hover:bg-[#f4f4f2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>
            <h3 className="text-center text-[50px] font-semibold tracking-[-0.02em] text-[#26302e]">
              Continue your journey
            </h3>
            <p className="mx-auto mt-3 max-w-[390px] text-center text-[17px] leading-7 text-[#75817d]">
              Take a deep breath. We&apos;ve missed your presence in this space.
            </p>
            {modalMethod === "phone" ? (
              <form onSubmit={onPhoneSubmit} className="mt-7 space-y-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => onPhoneNumberChange(event.target.value)}
                  placeholder="Enter phone number"
                  className="h-[56px] w-full rounded-full border border-[#e4e6e5] bg-[#f8f8f7] px-5 text-[15px] text-[#2f3332] outline-none transition focus:border-[#2f745f]"
                />
                {!isOtpStage ? (
                  <button
                    type="submit"
                    className="h-[48px] w-full rounded-full bg-[#2f745f] text-[14px] font-semibold text-white transition hover:bg-[#245d4c]"
                  >
                    Submit phone number
                  </button>
                ) : null}
              </form>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isSigningIn}
                aria-busy={isSigningIn}
                className="mt-7 flex h-[56px] w-full items-center justify-center gap-3 rounded-full bg-[#f3f3f1] text-[16px] font-semibold text-[#2f3332] transition hover:bg-[#ececea] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSigningIn ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 animate-spin text-[#2f745f]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="9" className="opacity-25" />
                      <path d="M21 12a9 9 0 0 1-9 9" strokeLinecap="round" className="opacity-90" />
                    </svg>
                    <span>Redirecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                      <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3a12 12 0 0 1-18-6.3l-6.5 5A20 20 0 0 0 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.5l6.3 5.3c-.4.4 6.7-4.9 6.7-14.8 0-1.2-.1-2.3-.4-3.5z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            )}
            {modalMethod === "phone" && isOtpStage ? (
              <form onSubmit={onOtpSubmit} className="mt-3 space-y-3">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(event) => onOtpCodeChange(event.target.value)}
                  placeholder="Enter OTP"
                  className="h-[52px] w-full rounded-xl border border-[#e4e6e5] bg-white px-4 text-[15px] text-[#2f3332] outline-none transition focus:border-[#2f745f]"
                />
                <button
                  type="submit"
                  className="h-[46px] w-full rounded-full bg-[#2f745f] text-[14px] font-semibold text-white transition hover:bg-[#245d4c]"
                >
                  Submit OTP
                </button>
              </form>
            ) : null}
            <p className="mt-7 text-center text-[12px] font-semibold uppercase tracking-widest text-[#b1b6b4]">
              Other ways to enter
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => onModalMethodChange("email")}
                className={`h-[52px] rounded-xl border text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  modalMethod === "email"
                    ? "border-[#2f745f] bg-[#dff2ea] text-[#2f745f]"
                    : "border-transparent bg-[#f3f3f1] text-[#5d6664] hover:bg-[#ececea]"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => onModalMethodChange("phone")}
                className={`h-[52px] rounded-xl border text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  modalMethod === "phone"
                    ? "border-[#2f745f] bg-[#dff2ea] text-[#2f745f]"
                    : "border-transparent bg-[#f3f3f1] text-[#5d6664] hover:bg-[#ececea]"
                }`}
              >
                Phone
              </button>
            </div>
            {isSigningIn ? (
              <p className="mt-5 text-center text-[12px] font-medium text-[#2f745f]">
                Hang tight — opening a secure Google sign-in window...
              </p>
            ) : (
              <p className="mt-6 text-center text-xs text-[#a1a8a6]">
                By entering, you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
