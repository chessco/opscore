package io.pitayacode.agent.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import android.app.Application
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import androidx.compose.material3.SmallTopAppBar
import kotlin.OptIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import android.content.Context
import android.provider.Settings
import android.text.TextUtils
import io.pitayacode.agent.features.commands.data.CommandService
import io.pitayacode.agent.features.policy.AgentDeviceAdminReceiver
import io.pitayacode.agent.features.input.RemoteControlService

@Composable
fun AgentStatusScreen(
    viewModel: AgentViewModel = hiltViewModel()
) {
    val isConnected by viewModel.isConnected.collectAsState()
    val isEnrolled by viewModel.isEnrolled.collectAsState()
    val isRemoteControlEnabled by viewModel.isRemoteControlEnabled.collectAsState()

    val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
    
    androidx.compose.runtime.DisposableEffect(lifecycleOwner) {
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

    Scaffold(
       topBar = {
           //TopAppBar(title = { Text("Pitaya Agent") })
          Text("PitayaCode Agent",modifier = Modifier.padding(16.dp))
           }

    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
        ) {
            StatusCard("Enrollment", if (isEnrolled) "Enrolled" else "Not Enrolled")
            Spacer(modifier = Modifier.height(8.dp))
            StatusCard("Backend Connection", if (isConnected) "Connected" else "Disconnected")
            Spacer(modifier = Modifier.height(8.dp))
            StatusCard("Remote Control", if (isRemoteControlEnabled) "Active" else "Inactive")
            
            Spacer(modifier = Modifier.height(16.dp))
            
            val context = androidx.compose.ui.platform.LocalContext.current
            
            Button(onClick = { viewModel.enroll(context) }, enabled = !isEnrolled) {
                Text("Enroll Device")
            }
            
            Spacer(modifier = Modifier.height(8.dp))

            Button(onClick = { viewModel.enableRemoteControl(context) }, enabled = !isRemoteControlEnabled) {
                Text("Enable Remote Control")
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // MediaProjection Logic
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

            Button(
                onClick = { launcher.launch(mediaProjectionManager.createScreenCaptureIntent()) },
                enabled = isEnrolled && isConnected
            ) {
                Text("Start Stream")
            }
        }
    }
}

@Composable
fun StatusCard(label: String, value: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = label, style = MaterialTheme.typography.labelMedium)
            Text(text = value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@HiltViewModel
class AgentViewModel @Inject constructor(
    private val application: Application,
    private val commandService: CommandService
) : ViewModel() {
    
    val isConnected = commandService.isConnected

    private val _isEnrolled = MutableStateFlow(false)
    val isEnrolled = _isEnrolled.asStateFlow()

    private val _isRemoteControlEnabled = MutableStateFlow(false)
    val isRemoteControlEnabled = _isRemoteControlEnabled.asStateFlow()

    private val devicePolicyManager = application.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val componentName = ComponentName(application, AgentDeviceAdminReceiver::class.java)

    init {
        checkEnrollmentStatus()
        checkAccessibilityStatus()
    }

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
                // FLAG_ACTIVITY_NEW_TASK removed to support Samsung/Foreground requirements
            }
            
            val resolveInfo = context.packageManager.resolveActivity(intent, 0)
            if (resolveInfo != null) {
                 android.util.Log.d("AgentViewModel", "Intent resolves to: ${resolveInfo.activityInfo.name}")
                 android.util.Log.d("AgentViewModel", "Starting activity with intent: $intent")
                 context.startActivity(intent)
            } else {
                 android.util.Log.e("AgentViewModel", "Intent NOT resolved! The system cannot handle ACTION_ADD_DEVICE_ADMIN.")
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
