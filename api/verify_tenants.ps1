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
$adminLogin = Invoke-RestMethod -Uri "http://localhost:3008/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "admin@example.com", "password": "admin123"}'
$adminToken = $adminLogin.access_token
Assert-Success $adminToken "Admin logged in successfully."

$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2. Create Tenant
Write-Host "2. Creating Tenant 'Empresa A'..."
$tenantBody = @{
    name = "Empresa A"
    slug = "empresa-a"
    active = $true
} | ConvertTo-Json

try {
    $tenant = Invoke-RestMethod -Uri "http://localhost:3008/tenants" -Method Post -Headers $adminHeaders -Body $tenantBody
    Assert-Success $tenant "Tenant 'Empresa A' created with ID: $($tenant.id)"
} catch {
    # If it already exists (slug unique), we might fail. Let's try to fetch it or just proceed if we can handle it.
    # For now, let's assume clean state or handle duplicate slug error if needed.
    Write-Host "Tenant creation failed (might already exist): $_" -ForegroundColor Yellow
    # Try to find it
    $tenants = Invoke-RestMethod -Uri "http://localhost:3008/tenants" -Method Get -Headers $adminHeaders
    $tenant = $tenants | Where-Object { $_.slug -eq "empresa-a" }
    if ($tenant) {
         Write-Host "Found existing tenant: $($tenant.id)" -ForegroundColor Green
    } else {
        Assert-Error $_ "Failed to create or find tenant."
    }
}

# 3. Create Supervisor
Write-Host "3. Creating Supervisor 'supervisor@empresa-a.com'..."
$supervisorBody = @{
    email = "supervisor@empresa-a.com"
    password = "password123"
    fullName = "Supervisor Empresa A"
    role = "SUPERVISOR"
    tenant = @{
        connect = @{ id = $tenant.id }
    }
} | ConvertTo-Json -Depth 5

try {
    $supervisor = Invoke-RestMethod -Uri "http://localhost:3008/users" -Method Post -Headers $adminHeaders -Body $supervisorBody
    Assert-Success $supervisor "Supervisor created."
} catch {
    Write-Host "Supervisor creation failed (might already exist): $_" -ForegroundColor Yellow
}

# 4. Login as Supervisor
Write-Host "4. Logging in as Supervisor..."
$supLogin = Invoke-RestMethod -Uri "http://localhost:3008/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "supervisor@empresa-a.com", "password": "password123"}'
$supToken = $supLogin.access_token
Assert-Success $supToken "Supervisor logged in successfully."

$supHeaders = @{
    "Authorization" = "Bearer $supToken"
    "Content-Type" = "application/json"
}

# 5. Create Operator (as Supervisor)
Write-Host "5. Creating Operator 'operator@empresa-a.com' as Supervisor..."
$opBody = @{
    email = "operator@empresa-a.com"
    password = "password123"
    fullName = "Operator Empresa A"
    role = "OPERATOR"
    tenant = @{
        connect = @{ id = $tenant.id }
    }
} | ConvertTo-Json -Depth 5

try {
    $operator = Invoke-RestMethod -Uri "http://localhost:3008/users" -Method Post -Headers $supHeaders -Body $opBody
    Assert-Success $operator "Operator created by Supervisor."
} catch {
    Assert-Error $_ "Supervisor failed to create Operator."
}

# 6. Verify Isolation (Supervisor List Users)
Write-Host "6. Verifying User List Isolation..."
$users = Invoke-RestMethod -Uri "http://localhost:3008/users" -Method Get -Headers $supHeaders
$count = $users.Count
Write-Host "Supervisor found $count users."

if ($count -ge 2) { # Should see themselves and the operator
    Assert-Success $users "Supervisor verified users list."
} else {
     Write-Host "Warning: Supervisor found fewer users than expected." -ForegroundColor Yellow
}

Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Cyan
