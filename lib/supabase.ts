import { createClient } from "@supabase/supabase-js";

const sanitizeEnv = (val: string | undefined): string => {
  if (!val) return "";
  let clean = val.trim();
  // Remove surrounding quotes if they exist
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
};

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL hoặc Anon Key chưa được cấu hình"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
