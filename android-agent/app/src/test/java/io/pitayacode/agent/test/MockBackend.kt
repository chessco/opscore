package io.pitayacode.agent.test

import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.RecordedRequest
import okhttp3.mockwebserver.MockWebServer

class MockBackend {
    private val server = MockWebServer()

    fun start(port: Int = 3005) {
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                return when (request.path) {
                    "/device/enroll/start" -> MockResponse().setBody("{\"challenge\": \"12345\"}")
                    "/device/enroll/finish" -> MockResponse().setBody("{\"certificateChain\": [\"MII...\"]}")
                    "/device/ack" -> MockResponse().setResponseCode(200)
                    "/device/telemetry" -> MockResponse().setResponseCode(200)
                    else -> MockResponse().setResponseCode(404)
                }
            }
        }
        server.start(port)
    }

    fun stop() {
        server.shutdown()
    }

    fun getUrl(): String {
        return server.url("/").toString()
    }
}
