$ErrorActionPreference = "Continue" # Continue so we can retry loops

# Configuration
$ApiUrl = "http://localhost:3008"
$AdminEmail = "admin@pitayacode.io"
$AdminPassword = "pitaya123"

function Log-Message {
    param($Message, $Color = "White")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Check-Adb {
    if (Get-Command "adb" -ErrorAction SilentlyContinue) {
        return $true
    }

    # Try adding common path
    $localAppData = $env:LOCALAPPDATA
    $adbPath = "$localAppData\Android\Sdk\platform-tools"
    if (Test-Path "$adbPath\adb.exe") {
        Log-Message "Found ADB at $adbPath, adding to PATH..." "Cyan"
        $env:Path += ";$adbPath"
        return $true
    }

    Log-Message "ADB not found in PATH or standard location. Please install Android Platform Tools." "Red"
    return $false
}

# 1. Login
Log-Message "Authenticating as Admin..." "Cyan"
try {
    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
            email    = $AdminEmail
            password = $AdminPassword
        } | ConvertTo-Json)
    
    $token = $loginResponse.access_token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    Log-Message "Authentication successful." "Green"
}
catch {
    Log-Message "Authentication failed: $_" "Red"
    exit 1
}

# 2. Get Default Tenant
try {
    $tenants = Invoke-RestMethod -Uri "$ApiUrl/tenants" -Method Get -Headers $headers
    $tenant = $tenants | Select-Object -First 1
    if (-not $tenant) { throw "No tenants found" }
    Log-Message "Using Tenant: $($tenant.name)" "Cyan"
}
catch {
    Log-Message "Failed to get tenant: $_" "Red"
    exit 1
}

# 3. Main Loop
Log-Message "Starting ADB Bridge... (Press Ctrl+C to stop)" "Yellow"

while ($true) {
    if (Check-Adb) {
        $adbOutput = adb devices -l
        
        # Parse output skipping first line "List of devices attached"
        $lines = $adbOutput -split "`n" | Where-Object { $_ -match "model:" }
        
        foreach ($line in $lines) {
            # Extract Serial and Model
            # Example: 9B091FFAZ00987         device product:bramble model:Pixel_4a_5G device:bramble transport_id:1
            if ($line -match "^(\S+)\s+.*model:(\S+)") {
                $serial = $matches[1]
                $model = $matches[2]
                
                # Fetch all devices to check existence
                try {
                    $allDevices = Invoke-RestMethod -Uri "$ApiUrl/devices" -Method Get -Headers $headers
                    $existingDevice = $allDevices | Where-Object { $_.androidId -eq $serial }
                }
                catch {
                    Log-Message "Failed to fetch devices: $_" "Red"
                    continue
                }

                # Create if not exists
                if (-not $existingDevice) {
                    try {
                        $deviceBody = @{
                            name      = $model
                            androidId = $serial
                            status    = "ONLINE"
                            tenant    = @{ connect = @{ id = $tenant.id } }
                        } | ConvertTo-Json -Depth 5
                        
                        $null = Invoke-RestMethod -Uri "$ApiUrl/devices" -Method Post -Headers $headers -Body $deviceBody -ErrorAction Stop
                        Log-Message "Registered new device: $model ($serial)" "Green"
                        
                        # Refresh ID
                        $allDevices = Invoke-RestMethod -Uri "$ApiUrl/devices" -Method Get -Headers $headers
                        $existingDevice = $allDevices | Where-Object { $_.androidId -eq $serial }
                    }
                    catch {
                        Log-Message "Error registering device ${serial}: $_" "Red"
                    }
                }

                # Send Heartbeat
                if ($existingDevice) {
                    try {
                        $null = Invoke-RestMethod -Uri "$ApiUrl/devices/$($existingDevice.id)/heartbeat" -Method Post -Headers $headers
                        Log-Message "Heartbeat sent: $model" "Gray"
                    }
                    catch {
                        Log-Message "Failed to send heartbeat for $model" "Red"
                    }
                }
            }
        }
    }
    
    Start-Sleep -Seconds 5
}
