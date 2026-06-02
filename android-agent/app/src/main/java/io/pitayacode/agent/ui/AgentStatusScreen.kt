package io.pitayacode.agent.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import android.app.Application
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.content.Context
import android.provider.Settings
import android.text.TextUtils
import io.pitayacode.agent.features.commands.data.CommandService
import io.pitayacode.agent.features.policy.AgentDeviceAdminReceiver
import io.pitayacode.agent.features.input.RemoteControlService
import io.pitayacode.agent.features.dialer.data.DialerRepository
import io.pitayacode.agent.features.dialer.data.LeadResponse
import io.pitayacode.agent.features.dialer.data.InteractionResponse
import io.pitayacode.agent.features.dialer.data.SurveyResponse
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import android.net.Uri
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Settings as SettingsIcon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Icon
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import org.json.JSONObject

// Deep Tech Utility Theme Colors
val DeepCharcoal = Color(0xFF121212)
val SurfaceElevated = Color(0xFF1E1E1E)
val ElectricCyan = Color(0xFF00E5FF)
val DeepViolet = Color(0xFF7C4DFF)
val TextPrimary = Color(0xFFE5E2E1)
val TextSecondary = Color(0xFFBAC9CC)

// Dialer UI State Machine
enum class DialerState { IDLE, FETCHING, READY, RINGING, SURVEY }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentStatusScreen(
    viewModel: AgentViewModel = hiltViewModel()
) {
    val isConnected by viewModel.isConnected.collectAsState()
    val isEnrolled by viewModel.isEnrolled.collectAsState()
    val isRemoteControlEnabled by viewModel.isRemoteControlEnabled.collectAsState()
    val isTokenExpired by viewModel.isTokenExpired.collectAsState()

    val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
    
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                viewModel.checkEnrollmentStatus()
                viewModel.checkAccessibilityStatus()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    var selectedTab by remember { mutableIntStateOf(0) }

    MaterialTheme(
        colorScheme = darkColorScheme(
            background = DeepCharcoal,
            surface = SurfaceElevated,
            primary = ElectricCyan,
            secondary = DeepViolet,
            onBackground = TextPrimary,
            onSurface = TextPrimary
        )
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { 
                        Text("PitayaCode Agent", color = ElectricCyan, fontWeight = FontWeight.Bold) 
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = DeepCharcoal
                    )
                )
            },
            bottomBar = {
                NavigationBar(containerColor = SurfaceElevated) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Filled.Call, contentDescription = "Dialer") },
                        label = { Text("Dialer") },
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DeepCharcoal,
                            selectedTextColor = ElectricCyan,
                            indicatorColor = ElectricCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Filled.SettingsIcon, contentDescription = "Configuration") },
                        label = { Text("Configuration") },
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DeepCharcoal,
                            selectedTextColor = ElectricCyan,
                            indicatorColor = ElectricCyan,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        )
                    )
                }
            },
            containerColor = DeepCharcoal
        ) { padding ->
            Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
                if (isTokenExpired) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFD32F2F)),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                    ) {
                        Text(
                            text = "Token Vencido: Ve a Configuration y escanea un nuevo QR",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(16.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }
                
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    if (selectedTab == 0) {
                        DialerScreen(viewModel)
                    } else {
                        ConfigScreen(viewModel, isConnected, isEnrolled, isRemoteControlEnabled)
                    }
                }
            }
        }
    }
}

@Composable
fun DialerScreen(viewModel: AgentViewModel) {
    val context = androidx.compose.ui.platform.LocalLifecycleOwner.current
    val androidContext = androidx.compose.ui.platform.LocalContext.current

    val dialerState by viewModel.dialerState.collectAsState()
    val currentLead by viewModel.currentLead.collectAsState()
    val currentInteraction by viewModel.currentInteraction.collectAsState()
    val currentSurvey by viewModel.currentSurvey.collectAsState()
    val dialerError by viewModel.dialerError.collectAsState()
    val surveyAnswers = remember { mutableStateMapOf<String, String>() }

    when (dialerState) {
        DialerState.IDLE -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(100.dp).padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(
                            color = ElectricCyan.copy(alpha = 0.1f),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 6.dp.toPx())
                        )
                    }
                    Icon(
                        imageVector = Icons.Filled.Call,
                        contentDescription = "Ready",
                        tint = ElectricCyan.copy(alpha = 0.5f),
                        modifier = Modifier.size(44.dp)
                    )
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    "Listo para marcar",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyLarge
                )
                if (dialerError != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = dialerError!!,
                        color = Color(0xFFFF5252),
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center
                    )
                }
                Spacer(modifier = Modifier.height(32.dp))
                Button(
                    onClick = { viewModel.fetchNextLead() },
                    modifier = Modifier.fillMaxWidth().height(60.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ElectricCyan,
                        contentColor = DeepCharcoal
                    )
                ) {
                    Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("OBTENER SIGUIENTE NÚMERO", fontWeight = FontWeight.ExtraBold)
                }
            }
        }

        DialerState.FETCHING -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(color = ElectricCyan, modifier = Modifier.size(56.dp))
                Spacer(modifier = Modifier.height(24.dp))
                Text("Buscando siguiente lead...", color = TextSecondary, style = MaterialTheme.typography.bodyLarge)
            }
        }

        DialerState.READY -> {
            val lead = currentLead
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("PRÓXIMO LEAD", color = ElectricCyan, style = MaterialTheme.typography.labelMedium, letterSpacing = 2.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            lead?.name ?: "—",
                            color = TextPrimary,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            lead?.phone ?: "—",
                            color = ElectricCyan,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
                Button(
                    onClick = {
                        lead?.let { l ->
                            // Open native dialer
                            try {
                                val intent = Intent(Intent.ACTION_DIAL).apply {
                                    data = Uri.parse("tel:${l.phone}")
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                androidContext.startActivity(intent)
                            } catch (e: Exception) {
                                android.util.Log.e("DialerScreen", "Error launching dialer", e)
                            }
                            // Notify backend and set RINGING state
                            viewModel.dialLead(l.id)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(60.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF00C853),
                        contentColor = Color.White
                    )
                ) {
                    Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("LLAMAR", fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleMedium)
                }
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = { viewModel.resetDialer() }) {
                    Text("Cancelar", color = TextSecondary)
                }
            }
        }

        DialerState.RINGING -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(100.dp).padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(
                            color = ElectricCyan.copy(alpha = 0.2f),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 8.dp.toPx())
                        )
                        drawArc(
                            color = ElectricCyan,
                            startAngle = -90f,
                            sweepAngle = 120f,
                            useCenter = false,
                            style = androidx.compose.ui.graphics.drawscope.Stroke(
                                width = 8.dp.toPx(),
                                cap = androidx.compose.ui.graphics.StrokeCap.Round
                            )
                        )
                    }
                    Icon(
                        imageVector = Icons.Filled.Call,
                        contentDescription = "Ringing",
                        tint = ElectricCyan,
                        modifier = Modifier.size(40.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = currentLead?.name ?: "",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "TIMBRANDO...",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.titleLarge,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Marca el resultado cuando termines la llamada.",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(48.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Button(
                        onClick = { viewModel.reportAnswered(androidContext) },
                        modifier = Modifier.weight(1f).height(56.dp).padding(end = 8.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00C853))
                    ) {
                        Icon(Icons.Filled.Call, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CONTESTÓ", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { viewModel.reportNotAnswered() },
                        modifier = Modifier.weight(1f).height(56.dp).padding(start = 8.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3E1111))
                    ) {
                        Icon(Icons.Filled.Close, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color(0xFFFF5252))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("NO CONTESTÓ", color = Color(0xFFFF5252), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        DialerState.SURVEY -> {
            val survey = currentSurvey
            val interaction = currentInteraction
            if (survey == null) {
                // No survey found, just reset
                LaunchedEffect(Unit) { viewModel.resetDialer() }
                return
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    survey.title,
                    color = ElectricCyan,
                    fontWeight = FontWeight.ExtraBold,
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Completa la encuesta antes de continuar.",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(20.dp))

                survey.schema.steps.forEach { step ->
                    when (step.type) {
                        "link" -> {
                            // Open link in browser immediately once
                            LaunchedEffect(step.id) {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(step.url)).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                androidContext.startActivity(intent)
                            }
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(step.question, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("🔗 Link externo abierto en el navegador", color = ElectricCyan, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                        "radio", "multiple_choice" -> {
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(step.question, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    step.options?.forEach { option ->
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(vertical = 4.dp)
                                        ) {
                                            RadioButton(
                                                selected = surveyAnswers[step.id] == option.value,
                                                onClick = { surveyAnswers[step.id] = option.value },
                                                colors = RadioButtonDefaults.colors(selectedColor = ElectricCyan)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(option.label, color = TextPrimary)
                                        }
                                    }
                                }
                            }
                        }
                        else -> {
                            // text / number / other free input
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceElevated),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(step.question, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = surveyAnswers[step.id] ?: "",
                                        onValueChange = { surveyAnswers[step.id] = it },
                                        modifier = Modifier.fillMaxWidth(),
                                        keyboardOptions = KeyboardOptions(
                                            keyboardType = if (step.type == "number") KeyboardType.Number else KeyboardType.Text
                                        ),
                                        placeholder = { Text("Tu respuesta...", color = TextSecondary) },
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = ElectricCyan,
                                            unfocusedBorderColor = TextSecondary,
                                            focusedTextColor = TextPrimary,
                                            unfocusedTextColor = TextPrimary
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        interaction?.let {
                            viewModel.submitSurveyResponse(it.id, surveyAnswers.toMap())
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = DeepViolet)
                ) {
                    Text("ENVIAR RESPUESTA", color = Color.White, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = { viewModel.resetDialer() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Omitir encuesta", color = TextSecondary)
                }
            }
        }
    }
}

@Composable
fun ConfigScreen(
    viewModel: AgentViewModel, 
    isConnected: Boolean, 
    isEnrolled: Boolean, 
    isRemoteControlEnabled: Boolean
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as android.media.projection.MediaProjectionManager
    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val serviceIntent = Intent(context, io.pitayacode.agent.features.streaming.StreamService::class.java).apply {
                action = io.pitayacode.agent.features.streaming.StreamService.ACTION_START_STREAM
                putExtra(io.pitayacode.agent.features.streaming.StreamService.EXTRA_RESULT_CODE, result.resultCode)
                putExtra(io.pitayacode.agent.features.streaming.StreamService.EXTRA_DATA, result.data)
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }

    // Config fields
    var serverUrl by remember { mutableStateOf(viewModel.getServerUrl()) }
    var authToken by remember { mutableStateOf(viewModel.getAuthToken()) }
    var campaignId by remember { mutableStateOf(viewModel.getCampaignId()) }
    var configSaved by remember { mutableStateOf(false) }

    val qrLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = ScanContract()
    ) { result ->
        if (result.contents != null) {
            try {
                val json = JSONObject(result.contents)
                serverUrl = json.optString("server_url", serverUrl)
                authToken = json.optString("auth_token", authToken)
                campaignId = json.optString("campaign_id", campaignId)
                viewModel.saveConfig(serverUrl, authToken, campaignId)
                configSaved = true
            } catch (e: Exception) {
                android.util.Log.e("ConfigScreen", "Error parsing QR json", e)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // --- API Config Section ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Configuración del Servidor", color = ElectricCyan, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, letterSpacing = 1.sp)
            Button(
                onClick = { 
                    qrLauncher.launch(ScanOptions().apply {
                        setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                        setPrompt("Escanea el código QR de Pitaya Ops Web")
                        setBeepEnabled(true)
                    }) 
                },
                colors = ButtonDefaults.buttonColors(containerColor = ElectricCyan, contentColor = DeepCharcoal),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(32.dp)
            ) {
                Text("ESCANEAR QR", fontWeight = FontWeight.Bold, fontSize = 10.sp)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        ConfigTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it; configSaved = false },
            label = "URL del Servidor",
            placeholder = "http://10.0.2.2:3005"
        )
        Spacer(modifier = Modifier.height(8.dp))
        ConfigTextField(
            value = authToken,
            onValueChange = { authToken = it; configSaved = false },
            label = "JWT Token",
            placeholder = "eyJhbGci..."
        )
        Spacer(modifier = Modifier.height(8.dp))
        ConfigTextField(
            value = campaignId,
            onValueChange = { campaignId = it; configSaved = false },
            label = "Campaign ID",
            placeholder = "cm_xxxxxxxx"
        )
        Spacer(modifier = Modifier.height(12.dp))
        Button(
            onClick = {
                viewModel.saveConfig(serverUrl, authToken, campaignId)
                configSaved = true
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (configSaved) Color(0xFF00C853) else DeepViolet,
                contentColor = Color.White
            )
        ) {
            Text(if (configSaved) "✓ GUARDADO" else "GUARDAR CONFIGURACIÓN", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(28.dp))
        Divider(color = SurfaceElevated)
        Spacer(modifier = Modifier.height(20.dp))

        // --- Status Section ---
        Text("Estado del Dispositivo", color = ElectricCyan, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, letterSpacing = 1.sp)
        Spacer(modifier = Modifier.height(12.dp))
        StatusCard("Enrollment", if (isEnrolled) "Enrolled" else "Not Enrolled", isEnrolled)
        Spacer(modifier = Modifier.height(12.dp))
        StatusCard("Backend Connection", if (isConnected) "Connected" else "Disconnected", isConnected)
        Spacer(modifier = Modifier.height(12.dp))
        StatusCard("Remote Control", if (isRemoteControlEnabled) "Active" else "Inactive", isRemoteControlEnabled)
        
        Spacer(modifier = Modifier.height(24.dp))

        // --- Actions Section ---
        Text("Acciones", color = ElectricCyan, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall, letterSpacing = 1.sp)
        Spacer(modifier = Modifier.height(12.dp))
        ConfigButton("ENROLL DEVICE", { viewModel.enroll(context) }, !isEnrolled)
        Spacer(modifier = Modifier.height(12.dp))
        ConfigButton("ENABLE REMOTE CONTROL", { viewModel.enableRemoteControl(context) }, !isRemoteControlEnabled)
        Spacer(modifier = Modifier.height(12.dp))
        ConfigButton("START STREAM", { launcher.launch(mediaProjectionManager.createScreenCaptureIntent()) }, isEnrolled && isConnected)
    }
}

@Composable
fun ConfigTextField(value: String, onValueChange: (String) -> Unit, label: String, placeholder: String) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, color = TextSecondary) },
        placeholder = { Text(placeholder, color = TextSecondary.copy(alpha = 0.5f)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        shape = RoundedCornerShape(8.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = ElectricCyan,
            unfocusedBorderColor = SurfaceElevated,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary
        )
    )
}

@Composable
fun ConfigButton(text: String, onClick: () -> Unit, enabled: Boolean) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = DeepViolet,
            contentColor = TextPrimary,
            disabledContainerColor = SurfaceElevated,
            disabledContentColor = TextSecondary
        )
    ) {
        Text(text, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun StatusCard(label: String, value: String, isActive: Boolean) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = label, color = TextSecondary, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = value, color = TextPrimary, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
            }
            Surface(
                shape = RoundedCornerShape(50),
                color = if (isActive) ElectricCyan else Color.Red,
                modifier = Modifier.size(12.dp)
            ) {}
        }
    }
}

@HiltViewModel
class AgentViewModel @Inject constructor(
    private val application: Application,
    private val commandService: CommandService,
    private val dialerRepository: DialerRepository
) : ViewModel() {
    
    val isConnected = commandService.isConnected

    private val _isEnrolled = MutableStateFlow(false)
    val isEnrolled = _isEnrolled.asStateFlow()

    private val _isRemoteControlEnabled = MutableStateFlow(false)
    val isRemoteControlEnabled = _isRemoteControlEnabled.asStateFlow()

    // --- Dialer State Machine ---
    private val _dialerState = MutableStateFlow(DialerState.IDLE)
    val dialerState = _dialerState.asStateFlow()

    private val _currentLead = MutableStateFlow<LeadResponse?>(null)
    val currentLead = _currentLead.asStateFlow()

    private val _currentInteraction = MutableStateFlow<InteractionResponse?>(null)
    val currentInteraction = _currentInteraction.asStateFlow()

    private val _currentSurvey = MutableStateFlow<SurveyResponse?>(null)
    val currentSurvey = _currentSurvey.asStateFlow()

    private val _dialerError = MutableStateFlow<String?>(null)
    val dialerError = _dialerError.asStateFlow()

    private val _isTokenExpired = MutableStateFlow(false)
    val isTokenExpired = _isTokenExpired.asStateFlow()

    private val devicePolicyManager = application.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val componentName = ComponentName(application, AgentDeviceAdminReceiver::class.java)

    init {
        checkEnrollmentStatus()
        checkAccessibilityStatus()
        checkTokenExpiration()

        // Auto-connect if we have config
        val serverUrl = getServerUrl()
        val authToken = getAuthToken()
        if (serverUrl.isNotBlank() && authToken.isNotBlank()) {
            val wsUrl = if (serverUrl.startsWith("https")) {
                serverUrl.replace("https://", "wss://") + "/agent"
            } else {
                serverUrl.replace("http://", "ws://") + "/agent"
            }
            commandService.connect(wsUrl, authToken)
        }
    }

    // --- Config helpers ---
    fun getServerUrl() = dialerRepository.getServerUrl()
    fun getAuthToken() = dialerRepository.getAuthToken()
    fun getCampaignId() = dialerRepository.getCampaignId()
    fun saveConfig(serverUrl: String, authToken: String, campaignId: String) {
        dialerRepository.saveConfig(serverUrl, authToken, campaignId)
        
        // Connect to CommandService with the new config
        if (serverUrl.isNotBlank() && authToken.isNotBlank()) {
            checkTokenExpiration()
            val wsUrl = if (serverUrl.startsWith("https")) {
                serverUrl.replace("https://", "wss://") + "/agent"
            } else {
                serverUrl.replace("http://", "ws://") + "/agent"
            }
            commandService.disconnect()
            commandService.connect(wsUrl, authToken)
        }
    }

    fun checkTokenExpiration() {
        val token = getAuthToken()
        if (token.isBlank()) {
            _isTokenExpired.value = false
            return
        }
        try {
            val parts = token.split(".")
            if (parts.size == 3) {
                val payload = String(android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE))
                val json = org.json.JSONObject(payload)
                if (json.has("exp")) {
                    val exp = json.getLong("exp")
                    val now = System.currentTimeMillis() / 1000
                    _isTokenExpired.value = exp < now
                } else {
                    _isTokenExpired.value = false
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AgentViewModel", "Failed to parse JWT", e)
            _isTokenExpired.value = false
        }
    }

    // --- Dialer Actions ---
    fun fetchNextLead() {
        _dialerError.value = null
        _dialerState.value = DialerState.FETCHING
        viewModelScope.launch {
            dialerRepository.getNextLead().fold(
                onSuccess = { lead ->
                    _currentLead.value = lead
                    _dialerState.value = DialerState.READY
                },
                onFailure = { e ->
                    _dialerError.value = "No se pudo obtener el siguiente lead: ${e.message}"
                    _dialerState.value = DialerState.IDLE
                }
            )
        }
    }

    fun dialLead(leadId: String) {
        viewModelScope.launch {
            dialerRepository.dialLead(leadId).fold(
                onSuccess = { dialResponse ->
                    _currentInteraction.value = dialResponse.interaction
                    _dialerState.value = DialerState.RINGING
                },
                onFailure = { e ->
                    android.util.Log.e("AgentViewModel", "dialLead failed: ${e.message}")
                    // Still show RINGING — call was initiated locally
                    _dialerState.value = DialerState.RINGING
                }
            )
        }
    }

    fun reportAnswered(context: Context) {
        val interactionId = _currentInteraction.value?.id
        val campaign = _currentInteraction.value?.campaign

        viewModelScope.launch {
            if (interactionId != null) {
                dialerRepository.updateInteractionStatus(interactionId, "ANSWERED")
            }

            // Check if Campaign is configured for EXTERNAL survey
            if (campaign?.surveyType == "EXTERNAL" && !campaign.externalSurveyUrl.isNullOrBlank()) {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(campaign.externalSurveyUrl)).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    android.util.Log.e("AgentViewModel", "Failed to open external survey", e)
                }
                resetDialer()
                return@launch
            }

            // Fetch internal survey
            dialerRepository.getSurveysForCampaign().fold(
                onSuccess = { surveys ->
                    val activeSurvey = surveys.firstOrNull { it.isActive }
                    _currentSurvey.value = activeSurvey

                    if (activeSurvey != null) {
                        // Check if it's a pure link survey (single step of type "link")
                        val allLinks = activeSurvey.schema.steps.all { it.type == "link" }
                        if (allLinks && activeSurvey.schema.steps.size == 1) {
                            // Open link and complete
                            val url = activeSurvey.schema.steps.first().url
                            if (!url.isNullOrBlank()) {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                }
                                context.startActivity(intent)
                            }
                            resetDialer()
                        } else {
                            _dialerState.value = DialerState.SURVEY
                        }
                    } else {
                        resetDialer()
                    }
                },
                onFailure = {
                    // No survey or error — just reset
                    resetDialer()
                }
            )
        }
    }

    fun reportNotAnswered() {
        val interactionId = _currentInteraction.value?.id
        viewModelScope.launch {
            if (interactionId != null) {
                dialerRepository.updateInteractionStatus(interactionId, "FAILED")
            }
            resetDialer()
        }
    }

    fun submitSurveyResponse(interactionId: String, answers: Map<String, String>) {
        viewModelScope.launch {
            val responseMap: Map<String, Any> = answers
            dialerRepository.submitSurveyResponse(interactionId, responseMap)
            resetDialer()
        }
    }

    fun resetDialer() {
        _currentLead.value = null
        _currentInteraction.value = null
        _currentSurvey.value = null
        _dialerError.value = null
        _dialerState.value = DialerState.IDLE
    }

    // --- Device Status ---
    fun checkEnrollmentStatus() {
        val isAdmin = devicePolicyManager.isAdminActive(componentName)
        _isEnrolled.value = isAdmin
        android.util.Log.d("AgentViewModel", "Checking enrollment status: $isAdmin")
    }

    fun checkAccessibilityStatus() {
        val context = application.applicationContext
        val expectedComponentName = ComponentName(context, RemoteControlService::class.java)
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        
        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)
        
        var enabled = false
        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            val enabledComponent = ComponentName.unflattenFromString(componentNameString)
            if (enabledComponent != null && enabledComponent == expectedComponentName) {
                enabled = true
                break
            }
        }
        _isRemoteControlEnabled.value = enabled
        android.util.Log.d("AgentViewModel", "Checking accessibility status: $enabled")
    }

    fun enroll(context: android.content.Context) {
        try {
            android.util.Log.d("AgentViewModel", "Enrollment triggered")
            android.util.Log.d("AgentViewModel", "Component Name: ${componentName.flattenToString()}")
            
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Activate device admin to enable kiosk mode and management features.")
            }
            
            val resolveInfo = context.packageManager.resolveActivity(intent, 0)
            if (resolveInfo != null) {
                 android.util.Log.d("AgentViewModel", "Intent resolves to: ${resolveInfo.activityInfo.name}")
                 context.startActivity(intent)
            } else {
                 android.util.Log.e("AgentViewModel", "Intent NOT resolved!")
            }
        } catch (e: Exception) {
            android.util.Log.e("AgentViewModel", "Error starting enrollment", e)
        }
    }

    fun enableRemoteControl(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (e: Exception) {
             android.util.Log.e("AgentViewModel", "Error opening accessibility settings", e)
        }
    }
}
