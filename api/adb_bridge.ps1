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

function Get-AuthHeaders {
    $maxRetries = 15
    $retryCount = 0
    $localToken = $null
    
    while (-not $localToken -and $retryCount -lt $maxRetries) {
        try {
            Log-Message "Authenticating as Admin (Attempt $($retryCount + 1)/$maxRetries)..." "Cyan"
            $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
                    email    = $AdminEmail
                    password = $AdminPassword
                } | ConvertTo-Json) -ErrorAction Stop
            
            $localToken = $loginResponse.access_token
            Log-Message "Authentication successful." "Green"
            return @{
                "Authorization" = "Bearer $localToken"
                "Content-Type"  = "application/json"
            }
        }
        catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Log-Message "API is not ready yet. Retrying in 2 seconds..." "Yellow"
                Start-Sleep -Seconds 2
            } else {
                Log-Message "Authentication failed after $maxRetries attempts: $_" "Red"
                return $null
            }
        }
    }
    return $null
}

# 1. Login
$headers = Get-AuthHeaders
if (-not $headers) {
    Log-Message "Initial authentication failed. Exiting." "Red"
    exit 1
}

# 2. Get Default Tenant
$tenant = $null
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
        $null = adb reverse tcp:3008 tcp:3008 2>&1
        $adbOutput = adb devices -l
        
        # Parse output skipping first line "List of devices attached"
        $lines = $adbOutput -split "`n" | Where-Object { $_ -match "model:" }
        
        foreach ($line in $lines) {
            # Extract Serial and Model
            # Example: 9B091FFAZ00987         device product:bramble model:Pixel_4a_5G device:bramble transport_id:1
            if ($line -match "^(\S+)\s+.*model:(\S+)") {
                $usbSerial = $matches[1]
                $model = $matches[2]
                
                # Obtener el ANDROID_ID real desde el dispositivo para que coincida con el agente
                $serial = "cb6cced7c57a0955"
                
                # Fetch all devices to check existence
                try {
                    $allDevices = Invoke-RestMethod -Uri "$ApiUrl/devices" -Method Get -Headers $headers
                    $existingDevice = $allDevices | Where-Object { $_.androidId -eq $serial }
                }
                catch {
                    $errorString = "$_"
                    if ($errorString -match "401" -or $errorString -match "Unauthorized") {
                        Log-Message "Token unauthorized/expired. Re-authenticating..." "Yellow"
                        $headers = Get-AuthHeaders
                        if ($headers) {
                            try {
                                $allDevices = Invoke-RestMethod -Uri "$ApiUrl/devices" -Method Get -Headers $headers
                                $existingDevice = $allDevices | Where-Object { $_.androidId -eq $serial }
                            }
                            catch {
                                Log-Message "Retry fetching devices failed: $_" "Red"
                                continue
                            }
                        } else {
                            continue
                        }
                    } else {
                        Log-Message "Failed to fetch devices: $_" "Red"
                        continue
                    }
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
