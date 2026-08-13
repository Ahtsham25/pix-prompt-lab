package com.shamiacademy.pixprompt

import android.app.Activity
import android.content.Context
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

/**
 * ============================================================
 * PRODUCTION IDs + TEST-DEVICE MODE
 * ============================================================
 * Your real App ID and real ad unit IDs stay exactly as they are.
 * Instead, THIS SPECIFIC PHONE is registered as a "test device" with
 * Google — so on this phone only, these same real ad unit IDs will
 * serve harmless test ad creatives instead of live ads. Impressions/
 * clicks on this device will NOT count as real traffic, so it's safe
 * to tap around while testing.
 *
 * ⚠️ ONE-TIME SETUP NEEDED — see TEST_DEVICE_IDS below.
 * ============================================================
 */
object AdsManager {

    // Your real banner ad unit ID
    private const val BANNER_AD_UNIT_ID = "ca-app-pub-9508264963334654/1103896314"

    // Your real interstitial ad unit ID
    private const val INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-9508264963334654/4851569630"

    // TODO: put your device's test ID here once you find it (see instructions).
    // Leave the list empty ( emptyList() ) to run in normal/live mode.
    private val TEST_DEVICE_IDS = listOf(
        "PASTE_YOUR_DEVICE_TEST_ID_HERE"
    )

    private var interstitialAd: InterstitialAd? = null
    private var actionsSinceLastInterstitial = 0
    private const val INTERSTITIAL_FREQUENCY = 3 // show on every 3rd "copy" tap

    fun init(context: Context) {
        val configuration = RequestConfiguration.Builder()
            .setTestDeviceIds(TEST_DEVICE_IDS)
            .build()
        MobileAds.setRequestConfiguration(configuration)

        MobileAds.initialize(context) {}
        preloadInterstitial(context)
    }

    fun loadBanner(activity: Activity, container: FrameLayout) {
        val adView = AdView(activity)
        adView.adUnitId = BANNER_AD_UNIT_ID
        adView.setAdSize(AdSize.BANNER)
        container.removeAllViews()
        container.addView(adView)
        adView.loadAd(AdRequest.Builder().build())
    }

    private fun preloadInterstitial(context: Context) {
        InterstitialAd.load(
            context,
            INTERSTITIAL_AD_UNIT_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: com.google.android.gms.ads.LoadAdError) {
                    interstitialAd = null
                }
            }
        )
    }

    /** Call this after actions like "copy prompt". Shows an interstitial every few actions. */
    fun maybeShowInterstitial(activity: Activity) {
        actionsSinceLastInterstitial++
        if (actionsSinceLastInterstitial < INTERSTITIAL_FREQUENCY) return
        actionsSinceLastInterstitial = 0

        val ad = interstitialAd
        if (ad == null) {
            preloadInterstitial(activity)
            return
        }

        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity)
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                preloadInterstitial(activity)
            }
        }
        ad.show(activity)
    }
}
