# PitayaCode Android Enterprise Agent

Agent de administración y streaming para dispositivos Android Enterprise (Device Owner).

## Características
-   **Seguridad**: mTLS, almacenamiento de claves en Keystore, Certificate Pinning.
-   **Gestión**: Device Owner, Managed Configs.
-   **Comandos**: WebSocket persistente para ejecución remota.
-   **Streaming**: WebRTC (MediaProjection) con soporte para Grid (360p) y Focus (720p).
-   **UI**: Jetpack Compose (Admin Dashboard).

## Requisitos de Compilación
-   Android Studio Iguana o superior.
-   JDK 17.
-   Dispositivo con Android 8.0+ (API 26) provisionado como Device Owner.

## Configuración

### 1. Provisioning (Device Owner)
Para desarrollo, usar `adb`:
```bash
adb shell dpm set-device-owner io.pitayacode.agent/.features.policy.AgentDeviceAdminReceiver
```

### 2. Managed Configurations
El agente se configura mediante restricciones de aplicación (Managed Configs). Claves principales:
-   `backend_base_url`: URL del API (ej. `https://callcenterapi.pitayacode.io`).
-   `tenant_id`: Identificador del tenant.
-   `logging_level`: Nivel de logs (INFO, DEBUG).

### 3. Enrollment
Al iniciar, el agente verifica si tiene un certificado. Si no:
1.  Genera un par de claves (EC) en el Android Keystore.
2.  Genera un CSR.
3.  Envía el CSR a `/device/enroll/start`.
4.  Recibe y almacena el certificado firmado.

## Arquitectura

-   **Core**: `io.pitayacode.agent.core` (Network, Security, DB).
-   **Features**: `io.pitayacode.agent.features` (Enrollment, Policy, Commands, Streaming).
-   **UI**: `io.pitayacode.agent.ui` (Compose).

usa **Hilt** para ID y **Coroutines/Flow** para asincronía.

## Comandos WebSocket
El agente escucha comandos firmados en `/device/commands`. Soporta:
-   `NAVIGATE`: Abrir deep links.
-   `STOP_ALL`: Detener toda ejecución.
-   `SET_STREAM_MODE`: GRID / FOCUS / PAUSE.

## Streaming
Usa la librería nativa de WebRTC (`org.webrtc`).
-   Servicio en primer plano (`StreamService`).
-   Captura mediante `MediaProjection API`.
-   Señalización vía WebSocket.

## Entornos (Build Variants)

El proyecto soporta dos entornos mediante Product Flavors:

### 1. DEV (`dev`)
-   **Uso**: Desarrollo local con Docker.
-   **Seguridad**:
    -   `ALLOW_INSECURE_SSL = true`: Acepta certificados self-signed.
    -   `ENABLE_PINNING = false`: Deshabilita certificate pinning.
-   **Fallbacks**: Si no hay Managed Configs, usa `http://10.0.2.2:3005` (Emulador) o IP local.

### 2. PROD (`prod`)
-   **Uso**: Despliegue en Hetzner (detrás de NGINX).
-   **Seguridad**:
    -   `ALLOW_INSECURE_SSL = false`: Requiere HTTPS válido.
    -   `ENABLE_PINNING = true`: Verifica la clave pública del servidor.
-   **Requisitos**: URLs *deben* venir de Managed Configs. Si faltan, el agente entra en **QUARANTINE**.

## Testing Local
Se incluye un `MockBackend` en `src/test` para pruebas unitarias sin servidor.

## Compilación
```bash
# Debug (Dev)
./gradlew assembleDevDebug

# Release (Prod)
./gradlew assembleProdRelease
```

## Producción con NGINX Proxy Manager (NPM)

En producción, el agente se conecta EXCLUSIVAMENTE al dominio público sin puertos expuestos.

### Topología
-   **Dominio Público**: `https://callcenter-api.pitayacode.io`
-   **Upstream Interno**: `http://callcenter:3005` (Docker Network)

### Requisitos de NPM
El Reverse Proxy debe configurarse con:
-   **Scheme**: `http`
-   **Forward Host**: `callcenter`
-   **Forward Port**: `3005`
-   **Websocket Support**: `ON` (Crucial para `/v1/ws/device/commands`)
-   **Block Common Exploits**: `ON`
-   **Force SSL**: `ON`
-   **Timeouts**: Incrementar `proxy_read_timeout` y `proxy_send_timeout` a `3600s` para mantener las conexiones WebSocket vivas.

### Managed Configs (Prod)
-   `backend_base_url`: `https://callcenter-api.pitayacode.io/v1`
-   `backend_ws_url`: `wss://callcenter-api.pitayacode.io/v1/ws`

