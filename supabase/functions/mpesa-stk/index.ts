// =============================================
// M-PESA STK PUSH — Supabase Edge Function
// Daraja API integration for Lipa Na M-Pesa Online
// =============================================
// Set these secrets in Supabase Dashboard → Edge Functions → Secrets:
// MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE
// =============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, reference, account_type } = await req.json()

    // Validate input
    if (!phone || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get credentials from environment
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const passkey = Deno.env.get('MPESA_PASSKEY')
    const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379' // sandbox default

    if (!consumerKey || !consumerSecret || !passkey) {
      return new Response(
        JSON.stringify({ success: false, error: 'M-Pesa credentials not configured. Add secrets in Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine environment (sandbox vs production)
    const isProduction = shortcode !== '174379'
    const baseUrl = isProduction
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    // Step 1: Get OAuth access token
    const authUrl = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenRes = await fetch(authUrl, {
      headers: { Authorization: `Basic ${auth}` },
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate with M-Pesa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = tokenData.access_token

    // Step 2: Generate password
    const timestamp = getTimestamp()
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // Step 3: Format phone number (2547XXXXXXXX)
    const formattedPhone = formatPhone(phone)

    // Step 4: Send STK push
    const stkUrl = `${baseUrl}/mpesa/stkpush/v1/processrequest`
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${req.headers.get('origin')}/api/mpesa-callback`,
      AccountReference: reference || 'Hot Blood FC',
      TransactionDesc: `${account_type || 'Payment'} - Hot Blood FC`,
    }

    const stkRes = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    })

    const stkData = await stkRes.json()

    if (stkData.ResponseCode === '0') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK push sent. Check your phone to complete payment.',
          checkoutRequestID: stkData.CheckoutRequestID,
          merchantRequestID: stkData.MerchantRequestID,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Format phone to 2547XXXXXXXX
function formatPhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '')
  if (p.startsWith('07')) p = '254' + p.substring(1)
  else if (p.startsWith('01')) p = '254' + p.substring(1)
  else if (p.startsWith('7')) p = '254' + p
  else if (p.startsWith('1')) p = '254' + p
  else if (p.startsWith('+254')) p = p.substring(1)
  return p
}

// Get timestamp in YYYYMMDDHHmmss format
function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}
