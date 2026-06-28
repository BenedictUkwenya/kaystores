import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type PrefillSetters = {
  setFirstName: React.Dispatch<React.SetStateAction<string>>;
  setLastName: React.Dispatch<React.SetStateAction<string>>;
  setBuyer: React.Dispatch<
    React.SetStateAction<{ email: string; phone: string }>
  >;
};

export function useCheckoutPrefill({
  setFirstName,
  setLastName,
  setBuyer,
}: PrefillSetters) {
  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;

      const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
      if (fullName) {
        const parts = fullName.split(/\s+/);
        setFirstName((current) => current || parts[0] || "");
        setLastName((current) => current || parts.slice(1).join(" ") || "");
      }

      setBuyer((current) => ({
        email: current.email || user.email || "",
        phone:
          current.phone ||
          (user.user_metadata?.phone as string | undefined) ||
          "",
      }));
    });
  }, [setFirstName, setLastName, setBuyer]);
}
