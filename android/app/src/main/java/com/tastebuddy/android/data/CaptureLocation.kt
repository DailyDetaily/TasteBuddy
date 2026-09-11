package com.tastebuddy.android.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.CancellationSignal
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull

object CaptureLocation {
    @SuppressLint("MissingPermission")
    suspend fun current(context: Context): Location? =
        withTimeoutOrNull(12_000) {
            val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val provider =
                listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER).firstOrNull {
                    manager.isProviderEnabled(it)
                } ?: return@withTimeoutOrNull null
            suspendCancellableCoroutine { continuation ->
                val cancel = CancellationSignal()
                continuation.invokeOnCancellation { cancel.cancel() }
                LocationManagerCompat.getCurrentLocation(
                    manager,
                    provider,
                    cancel,
                    ContextCompat.getMainExecutor(context),
                ) { location ->
                    if (continuation.isActive) continuation.resume(location)
                }
            }
        }
}
