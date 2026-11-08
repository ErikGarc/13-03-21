
import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";


const SUPABASE_URL = "https://ndowztatgxidqitvtmrv.supabase.co";
const SUPABASE_KEY = "sb_publishable_PYGvt_K6OeH02m6KhDV7Sw_xq9gM1WP";

export function crearClienteSupabase(auth) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => {
      const usuario = auth.currentUser;

      if (!usuario) {
        return null;
      }

      return await usuario.getIdToken();
    }
  });
}
