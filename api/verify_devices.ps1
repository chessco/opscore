$ErrorActionPreference = "Stop"

function Assert-Success {
    param($Response, $Message)
    Write-Host "✅  $Message" -ForegroundColor Green
}

function Assert-Error {
    param($Response, $Message)
    Write-Host "❌  $Message" -ForegroundColor Red
    exit 1
}

# 1. Login as Admin
Write-Host "1. Logging in as Admin..."
$adminLogin = Invoke-RestMethod -Uri "http://localhost:3008/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "admin@pitayacode.io", "password": "pitaya123"}'
$adminToken = $adminLogin.access_token
Assert-Success $adminToken "Admin logged in successfully."

$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type"  = "application/json"
}

# 2. Get Default Tenant (or any tenant)
$tenants = Invoke-RestMethod -Uri "http://localhost:3008/tenants" -Method Get -Headers $adminHeaders
$tenant = $tenants | Select-Object -First 1
Assert-Success $tenant "Using Tenant: $($tenant.name)"

# 3. Create Device as Admin
Write-Host "3. Creating Device 'Tablet 01'..."
$deviceId = "android-" + (Get-Random)
$deviceBody = @{
    name      = "Tablet 01"
    androidId = $deviceId
    status    = "OFFLINE"
    tenant    = @{
        connect = @{ id = $tenant.id }
    }
} | ConvertTo-Json -Depth 5

try {
    $device = Invoke-RestMethod -Uri "http://localhost:3008/devices" -Method Post -Headers $adminHeaders -Body $deviceBody
    Assert-Success $device "Device created with ID: $($device.id)"
}
catch {
    Assert-Error $_ "Failed to create device."
}

# 4. Verify Initial Status
if ($device.status -eq "OFFLINE") {
    Assert-Success $device "Initial status is OFFLINE."
}
else {
    Assert-Error $device "Initial status is NOT OFFLINE."
}

# 5. Send Heartbeat
Write-Host "5. Sending Heartbeat..."
try {
    $heartbeat = Invoke-RestMethod -Uri "http://localhost:3008/devices/$($device.id)/heartbeat" -Method Post
    Assert-Success $heartbeat "Heartbeat sent."
}
catch {
    Assert-Error $_ "Failed to send heartbeat."
}

# 6. Verify Online Status
$deviceCheck = Invoke-RestMethod -Uri "http://localhost:3008/devices/$($device.id)" -Method Get -Headers $adminHeaders
if ($deviceCheck.status -eq "ONLINE") {
    Assert-Success $deviceCheck "Status updated to ONLINE."
}
else {
    Assert-Error $deviceCheck "Status failed to update to ONLINE. Current: $($deviceCheck.status)"
}

Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Cyan
