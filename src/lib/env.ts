export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
};

if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    "Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não está definida. Verifique o arquivo .env"
  );
}

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    "Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida. Verifique o arquivo .env"
  );
}
