package com.tastebuddy.android

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder
import com.tastebuddy.android.data.*

class TasteBuddyApplication : Application(), ImageLoaderFactory {
    val catalogs by lazy { Catalogs(this) }
    val repository by lazy { AppRepository(filesDir) }
    val photos by lazy { PhotoStore(this) }
    val backend by lazy {
        BackendClient(
            BackendConfig(),
            SecureSessionStore(this, "session"),
            SecureSessionStore(this, "oauth"),
        )
    }
    val places by lazy { PlacesClient() }

    override fun newImageLoader() =
        ImageLoader.Builder(this).components { add(SvgDecoder.Factory()) }.build()
}
