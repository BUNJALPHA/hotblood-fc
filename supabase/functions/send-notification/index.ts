// =============================================
// SEND NOTIFICATION — Supabase Edge Function
// Sends email (Resend) + creates in-app notification record
// Trigger: call from client or database webhook
// =============================================
// Secrets needed (Supabase → Edge Functions → Secrets):
// RESEND_API_KEY, FROM_EMAIL (e.g. noreply@hotbloodfc.com)
// =============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, title, message, type = 'general', send_email = true, link } = await req.json()

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id, title, message required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Insert in-app notification
    const { error: insertError } = await supabase.from('notifications').insert({
      user_id,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    })

    if (insertError) {
      console.error('Insert error:', insertError.message)
    }

    // 2. Send email if enabled
    if (send_email) {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@hotbloodfc.com'

      if (resendKey) {
        // Get user email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user_id)
          .single()

        if (profile?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `Hot Blood FC <${fromEmail}>`,
              to: [profile.email],
              subject: title,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ea580c; font-size: 28px; margin: 0;">HOT BLOOD FC</h1>
                    <p style="color: #64748b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Passion · Power · Victory</p>
                  </div>
                  <h2 style="color: #ffffff; font-size: 22px;">${title}</h2>
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">${message}</p>
                  <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;" />
                  <p style="color: #475569; font-size: 12px;">You're receiving this because you're a registered member of Hot Blood FC.</p>
                </div>
              `,
            }),
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
