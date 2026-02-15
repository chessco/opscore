package io.pitayacode.agent.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@Composable
fun AgentStatusScreen(
    viewModel: AgentViewModel = hiltViewModel()
) {
    val isConnected by viewModel.isConnected.collectAsState()
    val isEnrolled by viewModel.isEnrolled.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Pitaya Agent") })
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
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(onClick = { viewModel.enroll() }, enabled = !isEnrolled) {
                Text("Enroll Device")
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
class AgentViewModel @Inject constructor() : ViewModel() {
    // Mock ViewModel for UI structure
    private val _isConnected = MutableStateFlow(false)
    val isConnected = _isConnected.asStateFlow()

    private val _isEnrolled = MutableStateFlow(false)
    val isEnrolled = _isEnrolled.asStateFlow()

    fun enroll() {
        // Trigger enrollment logic
    }
}
