# Kay Stores — set Resend secrets on Supabase + deploy send-email function
# Run AFTER: supabase login  &&  supabase link --project-ref YOUR_REF

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Kay Stores - Supabase email setup" -ForegroundColor Cyan
Write-Host ""

$ref = $null
if (Test-Path "supabase\.temp\project-ref") {
  $ref = (Get-Content "supabase\.temp\project-ref" -Raw).Trim()
}
if (-not $ref -and (Test-Path ".env.local")) {
  $url = (Select-String -Path ".env.local" -Pattern "^NEXT_PUBLIC_SUPABASE_URL=(.+)$").Matches.Groups[1].Value.Trim()
  if ($url -match 'https://([^.]+)\.supabase\.co') { $ref = $matches[1] }
}

if (-not $ref) {
  Write-Host "No project ref. Run: supabase link --project-ref zjigheafrxxrodalosbz" -ForegroundColor Yellow
  exit 1
}

Write-Host "Project ref: $ref"
Write-Host ""

$resendKey = $env:RESEND_API_KEY
if (-not $resendKey) {
  $resendKey = Read-Host "RESEND_API_KEY (re_...)"
}
$fromEmail = $env:RESEND_FROM_EMAIL
if (-not $fromEmail) {
  $fromEmail = Read-Host "RESEND_FROM_EMAIL (e.g. Kay <noreply@yourdomain.com>)"
}
$teamEmail = $env:KAY_TEAM_EMAIL
if (-not $teamEmail) {
  $teamEmail = Read-Host "KAY_TEAM_EMAIL (team inbox for alerts)"
}

Write-Host ""
Write-Host "Setting Supabase secrets..." -ForegroundColor Cyan
supabase secrets set `
  "RESEND_API_KEY=$resendKey" `
  "RESEND_FROM_EMAIL=$fromEmail" `
  "KAY_TEAM_EMAIL=$teamEmail" `
  --project-ref $ref

Write-Host ""
Write-Host "Deploying send-email Edge Function..." -ForegroundColor Cyan
supabase functions deploy send-email --project-ref $ref --no-verify-jwt

Write-Host ""
Write-Host "Deploying send-auth-email (auth OTP hook)..." -ForegroundColor Cyan
supabase functions deploy send-auth-email --project-ref $ref --no-verify-jwt

Write-Host ""
Write-Host "Done. Secrets live on Supabase only (not in .env.local)." -ForegroundColor Green
Write-Host ""
Write-Host "AUTH EMAILS (required for signup codes):" -ForegroundColor Yellow
Write-Host "  1. Dashboard -> Authentication -> Hooks -> Send Email -> HTTPS"
Write-Host "  2. URL: https://$ref.supabase.co/functions/v1/send-auth-email"
Write-Host "  3. Generate secret, then: supabase secrets set SEND_EMAIL_HOOK_SECRET=`"v1,whsec_...`" --project-ref $ref"
Write-Host "  4. Enable the hook"
Write-Host ""
Write-Host "Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY for Next.js to invoke send-email."
