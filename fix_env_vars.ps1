$vars = @{
    "VITE_SUPABASE_URL"             = "https://fjwwkjtfwlomvuqpochk.supabase.co"
    "VITE_SUPABASE_PUBLISHABLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3dranRmd2xvbXZ1cXBvY2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODk0NzcsImV4cCI6MjA4Mzc2NTQ3N30.9ZWpneOBq84flxmTv1td3Y0EfA-WvMIskWaI4ux_ccc"
    "VITE_VAPI_PUBLIC_KEY"          = "02ead3b2-c6ec-44f4-a254-2a581a956a09"
    "VITE_VAPI_ASSISTANT_ID"        = "adc24232-9015-4b7d-ab00-c3ff1619a8e6"
    "VITE_HOSPITAL_PHONE_NUMBER"    = "+91-123-456-7890"
    "VITE_SUPABASE_PROJECT_ID"      = "fjwwkjtfwlomvuqpochk"
}

foreach ($key in $vars.Keys) {
    Write-Host "Fixing $key..."
    # Remove existing
    cmd /c "echo y | npx vercel env rm $key production"
    
    Start-Sleep -Seconds 2
    
    $val = $vars[$key]
    Write-Host "Adding $key..."
    # Use node to print without newline to pipe strict value
    node -e "process.stdout.write('$val')" | npx vercel env add $key production
    
    Start-Sleep -Seconds 2
}
