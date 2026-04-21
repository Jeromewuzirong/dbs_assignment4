import { signOutAction } from "@/app/actions";

export const AuthButton = () => {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Sign out
      </button>
    </form>
  );
};
