package com.tastebuddy.android.data

import com.tastebuddy.android.domain.*
import java.time.Instant
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class BackendClientTest {
    private class MemoryStorage : SessionStorage {
        var value: String? = null

        override fun read() = value

        override fun write(value: String?) {
            this.value = value
        }
    }

    private lateinit var server: MockWebServer
    private lateinit var session: MemoryStorage
    private lateinit var oauth: MemoryStorage
    private lateinit var backend: BackendClient

    @Before
    fun setup() {
        server = MockWebServer()
        server.start()
        session = MemoryStorage()
        oauth = MemoryStorage()
        backend =
            BackendClient(
                BackendConfig(
                    server.url("/").toString(),
                    "sb_publishable_test",
                    "https://chatgpt.com/plugins/taste-buddy",
                    allowLoopback = true,
                ),
                session,
                oauth,
            )
    }

    @After
    fun close() {
        server.shutdown()
    }

    private fun response(body: String, code: Int = 200) =
        MockResponse()
            .setResponseCode(code)
            .setHeader("Content-Type", "application/json")
            .setBody(body)

    private fun authBody(
        id: String = "test-user",
        expires: Long = Instant.now().epochSecond + 3600,
    ) =
        """{"access_token":"test-access","refresh_token":"test-refresh","expires_at":$expires,"user":{"id":"$id","email":"sample@example.com","is_anonymous":false,"email_confirmed_at":"2026-01-01T00:00:00Z"}}"""

    private fun request() = server.takeRequest(2, TimeUnit.SECONDS) ?: error("요청이 없습니다")

    @Test
    fun otpUsesEmailContractAndDoesNotCreateSessionBeforeVerification() = runBlocking {
        server.enqueue(response("{}"))
        backend.sendOTP(" sample@example.com ")
        val send = request()
        assertEquals("/auth/v1/otp", send.path)
        assertEquals("sb_publishable_test", send.getHeader("apikey"))
        assertEquals(
            "sample@example.com",
            AppJson.parseToJsonElement(send.body.readUtf8()).jsonObject.string("email"),
        )
        assertNull(session.value)
        server.enqueue(response(authBody()))
        backend.verifyOTP("sample@example.com", "123456")
        val verify = request()
        assertEquals(
            "email",
            AppJson.parseToJsonElement(verify.body.readUtf8()).jsonObject.string("type"),
        )
        assertEquals("test-user", backend.sessionState.value?.user?.id)
        assertNotNull(session.value)
    }

    @Test
    fun rejectedOTPLeavesExistingSessionUnchanged() = runBlocking {
        server.enqueue(response("""{"error_code":"otp_expired"}""", 403))
        assertTrue(
            runCatching { backend.verifyOTP("sample@example.com", "123456") }.exceptionOrNull()
                is ApiException
        )
        assertNull(session.value)
    }

    @Test
    fun concurrentExpiredSessionRequestsRefreshOnce() = runBlocking {
        session.value =
            AppJson.encodeToString(AuthSession("old", "refresh", 1, AuthUser("test-user")))
        server.enqueue(response(authBody()))
        backend.restore()
        val a = async { backend.session() }
        val b = async { backend.session() }
        assertEquals(a.await(), b.await())
        assertEquals("/auth/v1/token?grant_type=refresh_token", request().path)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun oauthUsesPkceAndRejectsAnUninitiatedCallback() = runBlocking {
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=untrusted") }
                .isFailure
        )
        val url = backend.googleSignInURL().toHttpUrl()
        assertEquals(BackendClient.AUTH_REDIRECT, url.queryParameter("redirect_to"))
        assertEquals("s256", url.queryParameter("code_challenge_method"))
        assertFalse(url.queryParameter("code_challenge").isNullOrBlank())
        assertNotNull(oauth.value)
        server.enqueue(response(authBody()))
        backend.handleCallback("tastebuddy://auth/callback?code=test-code")
        val body = AppJson.parseToJsonElement(request().body.readUtf8()).jsonObject
        assertEquals("test-code", body.string("auth_code"))
        assertTrue(body.string("code_verifier").length >= 43)
        assertNull(oauth.value)
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=test-code") }
                .isFailure
        )
    }

    @Test
    fun expiredOauthIsNotExchanged() = runBlocking {
        oauth.value =
            AppJson.encodeToString(PendingOAuth("verifier", Instant.now().epochSecond - 601))
        assertTrue(
            runCatching { backend.handleCallback("tastebuddy://auth/callback?code=code") }.isFailure
        )
        assertEquals(0, server.requestCount)
    }

    @Test
    fun linkedEmailVerificationMustPreserveUser() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "old",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner", isAnonymous = true),
                )
            )
        backend.restore()
        server.enqueue(response(authBody("other")))
        assertTrue(
            runCatching { backend.verifyOTP("sample@example.com", "123456", true) }.isFailure
        )
        assertEquals("owner", backend.sessionState.value?.user?.id)
    }

    @Test
    fun peopleSearchFallsBackOnlyForMissingRpc() = runBlocking {
        server.enqueue(response("""{"code":"PGRST202"}""", 404))
        server.enqueue(response("""[{"id":"p1","display_name":"버디","nickname":"buddy"}]"""))
        val people = backend.searchPeople("@buddy")
        assertEquals("버디", people.single().title)
        assertEquals("/rest/v1/rpc/search_profiles_by_identity", request().path)
        assertEquals("/rest/v1/rpc/search_profiles_by_nickname", request().path)
    }

    @Test
    fun failedAccountDeletionRetainsSession() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "access",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner"),
                )
            )
        backend.restore()
        server.enqueue(response("{}", 500))
        assertTrue(runCatching { backend.deleteAccount() }.isFailure)
        assertNotNull(session.value)
        assertNotNull(backend.sessionState.value)
    }

    @Test
    fun exportRequiresSameAccountBeforeSending() = runBlocking {
        session.value =
            AppJson.encodeToString(
                AuthSession(
                    "access",
                    "refresh",
                    Instant.now().epochSecond + 3600,
                    AuthUser("owner", "sample@example.com"),
                )
            )
        backend.restore()
        assertTrue(
            runCatching { backend.publishAnalysis(SensorySnapshot(), "someone-else") }.isFailure
        )
        assertEquals(0, server.requestCount)
    }

    @Test
    fun confidentialKeysAndUntrustedChatGPTUrlsAreRejected() {
        assertTrue(
            runCatching { BackendConfig("https://example.supabase.co", "sb_secret_no").validate() }
                .isFailure
        )
        listOf(
                "http://chatgpt.com/plugins/test",
                "https://chatgpt.com.evil.example/plugins/test",
                "https://chatgpt.com/plugins/test?q=secret",
                "https://user@chatgpt.com/plugins/test",
                "https://chatgpt.com/plugins/",
            )
            .forEach { assertNull(BackendConfig(chatGPTEntryURL = it).validChatGPTURL()) }
        assertNotNull(
            BackendConfig(chatGPTEntryURL = "https://chatgpt.com/plugins/test").validChatGPTURL()
        )
    }
}
